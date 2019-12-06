'use strict';

/** True if running in tests. */
const DEBUG = /test[\\\/]test[-\w]*\.js$/.test(module.parent && module.parent.filename);

// Load dependencies.
const fetch = global.fetch || require(`${'node-fetch'}`);
const URL   = global.URL   || require(`${'url'}`).URL;

// Assign configurations.
RiotApi.emptyConfig      = require('./emptyConfig.json');
RiotApi.defaultConfig    = require('./defaultConfig.json');
RiotApi.championGGConfig = require('./championGGConfig.json');


/** Returns a formatted string, replacing "%s" with supplied args. */
function format(format, ...args) {
  let i = 0;
  const result = format.replace(/%s/g, () => args[i++]);
  if (i !== args.length)
    throw new Error(`Wrong number of args provided for format "${format}", ${args.length} provided, ${i} needed.`);
  return result;
}

/** Returns a promise that resolves after the supplied delay. */
function delayPromise(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}


/** `RiotApi(key [, config])` or `RiotApi(config)` with `config.key` set. */
function RiotApi(key, config = {}) {
  if (!(this instanceof RiotApi)) return new RiotApi(...arguments);
  this.config = JSON.parse(JSON.stringify(RiotApi.defaultConfig));
  if (key instanceof Object)
    config = key;
  else
    this.config.key = key;
  Object.assign(this.config, config);
  this.regions = {};
  this.hasRegions = this.config.origin.includes('%s');
}
RiotApi.prototype.get = function() {
  if (!this.hasRegions)
    return this._getRegion(null).get(this.config.origin, ...arguments);
  let [ region, ...rest ] = arguments;
  rest.unshift(format(this.config.origin, region));
  return this._getRegion(region).get(...rest);
};
/** Limits requests to FACTOR fraction of normal rate limits, allowing multiple
  * instances to be used across multiple processes/machines.
  * This can be called at any time. */
RiotApi.prototype.setDistFactor = function(factor) {
  if (factor <= 0 || factor > 1)
    throw new Error("Factor must be greater than zero and non-greater than one.");
  if (this.config.distFactor === factor)
    return;
  this.config.distFactor = factor;
  Object.values(this.regions).forEach(r => r.updateDistFactor());
};
RiotApi.prototype._getRegion = function(region) {
  if (this.regions[region])
    return this.regions[region];
  return (this.regions[region] = new Region(this.config));
};


/** RateLimits for a region. One app limit and any number of method limits. */
function Region(config) {
  this.config = config;
  this.appLimit = new RateLimit(this.config.rateLimitTypeApplication, 1, this.config);
  this.methodLimits = {};
  this.concurrentSema = new Semaphore(this.config.maxConcurrent);
}
Region.prototype.get = function(origin, target, ...args) {
  // Get query param arg.
  let queryParams = {};
  if (typeof args[args.length - 1] === 'object') // If last obj is query string, pop it off and apply it.
    queryParams = args.pop();

  // Interpolate path.
  let path = this.config.endpoints;
  for (let segment of target.split('.')) {
    path = path[segment];
    if (!path) throw new Error(`Missing path segment "${segment}" in "${target}".`);
  }
  path = format(path, ...args.map(arg => encodeURIComponent(arg)));

  // Build URL.
  let urlBuilder = new URL(path, origin);
  // Build URL query params.
  for (let [ key, vals ] of Object.entries(queryParams)) {
    if (!Array.isArray(vals)) // Not array.
      urlBuilder.searchParams.set(key, vals);
    else if (this.config.collapseQueryArrays) // Array, collapse.
      urlBuilder.searchParams.set(key, vals.join(','));
    else // Array, do not collapse.
      vals.forEach(val => urlBuilder.searchParams.append(key, val));
  }

  // Create fetch config.
  let fetchConfig = {
    // TODO: method.
    headers: {}, // TODO.
    keepalive: true // keep-alive.
  };
  if (this.config.keyHeader)
    fetchConfig.headers[this.config.keyHeader] = this.config.key;
  else
    urlBuilder.searchParams.set(this.config.keyQueryParam, this.config.key);

  let rateLimits = [ this.appLimit ];
  if (this.config.rateLimitTypeMethod) // Also method limit if applicable.
    rateLimits.push(this._getMethodLimit(target));

  return (async () => {
    // Acquire concurrent request permit.
    // Note: This considers the time spent waiting for rate limits.
    await this.concurrentSema.acquire();
    // Fetch retry loop.
    let response, delay;
    for (let retries = 0; retries < this.config.retries; retries++) {
      // Waut for rate limits.
      while ((delay = RateLimit.getAllOrDelay(rateLimits)) >= 0)
        await delayPromise(delay);

      response = await fetch(urlBuilder.href, fetchConfig);
      // Release concurrent request permit.
      // Note: This may be released before the full response body is read.
      this.concurrentSema.release();

      // Update if rate limits changed or 429 returned.
      rateLimits.forEach(rl => rl.onResponse(response));

      // Handle status codes.
      if ([ 204, 404, 422 ].includes(response.status)) // Successful response, but no data found.
        return null;
      if (response.ok) // Successful response (presumably) with body.
        return await response.json();
      if (429 !== response.status && response.status < 500) // Non-retryable responses.
        break;
    }
    // Request failed.
    const err = new Error(`Request failed after ${retries} with code ${response.status}. ` +
      "The 'response' field of this Error contains the failed Response for debugging or error handling.");
    err.response = response;
    throw err;
  })();
};
Region.prototype.updateDistFactor = function() {
  this.appLimit.setDistFactor(this.config.distFactor);
  Object.values(this.methodLimits).forEach(rl => rl.setDistFactor(this.config.distFactor));
};
Region.prototype._getMethodLimit = function(method) {
  if (this.methodLimits[method])
    return this.methodLimits[method];
  return (this.methodLimits[method] = new RateLimit(this.config.rateLimitTypeMethod, 1, this.config));
};


/** Rate limit. A collection of token buckets, updated when needed. */
function RateLimit(type, distFactor, config) {
  this.config = config;
  this.type = type;
  this.buckets = this.config.defaultBuckets.map(b => new TokenBucket(b.timespan, b.limit, b));
  this.retryAfter = 0;
  this.distFactor = distFactor;
}
RateLimit.prototype.retryDelay = function() {
  let now = Date.now();
  return now > this.retryAfter ? -1 : this.retryAfter - now;
};
RateLimit.prototype.onResponse = function(response) {
  // Handle 429 retry-after header (if exists).
  if (429 === response.status) {
    let type = response.headers.get(this.config.headerLimitType) || this.config.defaultLimitType;
    if (!type)
      throw new Error('Response missing type.');
    if (this.type.name === type.toLowerCase()) {
      let retryAfter = +response.headers.get(this.config.headerRetryAfter);
      if (Number.isNaN(retryAfter))
        throw new Error('Response 429 missing retry-after header.');
      this.retryAfter = Date.now() + retryAfter * 1000 + 500;
    }
  }
  // Update rate limit from headers (if changed).
  let limitHeader = response.headers.get(this.type.headerLimit);
  let countHeader = response.headers.get(this.type.headerCount);
  if (this._bucketsNeedUpdate(limitHeader, countHeader))
    this.buckets = RateLimit._getBucketsFromHeaders(limitHeader, countHeader);
};
RateLimit.prototype.setDistFactor = function(factor) {
  this.distFactor = factor;
  this.buckets.forEach(b => b.setDistFactor(factor));
};
RateLimit.prototype._bucketsNeedUpdate = function(limitHeader, countHeader) {
  if (!limitHeader || !countHeader)
    return false;
  let limits = this.buckets.map(b => b.toLimitString()).join(',');
  return limitHeader !== limits;
};
RateLimit._getBucketsFromHeaders = function(limitHeader, countHeader) {
  // Limits: "20000:10,1200000:600"
  // Counts: "7:10,58:600"
  let limits = limitHeader.split(',');
  let counts = countHeader.split(',');
  if (limits.length !== counts.length)
    throw new Error(`Limit and count headers do not match: ${limitHeader}, ${countHeader}.`);

  return limits
    .map((limit, i) => {
      let count = counts[i];
      let [ limitVal, limitSpan ] = limit.split(':').map(Number);
      let [ countVal, countSpan ] = count.split(':').map(Number);
      limitSpan *= 1000;
      countSpan *= 1000;
      if (limitSpan != countSpan)
        throw new Error(`Limit span and count span do not match: ${limitSpan}, ${countSpan}.`);

      let bucket = new TokenBucket(limitSpan, limitVal, { distFactor: this.distFactor });
      bucket.getTokens(countVal);
      return bucket;
    });
};
RateLimit.getAllOrDelay = function(rateLimits) {
  let delay = rateLimits
    .map(r => r.retryDelay())
    .reduce((a, b) => Math.max(a, b), -1);
  if (delay >= 0)
    return delay; // Techincally the delay could be more but whatev.
  let allBuckets = [].concat.apply([], rateLimits.map(rl => rl.buckets));
  return TokenBucket.getAllOrDelay(allBuckets);
};

/** Token bucket. Represents a single "100:60", AKA a 100 tokens per 60 seconds pair. */
function TokenBucket(timespan, limit, { distFactor = 1, factor = 20, spread = 500 / timespan, now = Date.now } = {}) {
  this.now = now;

  this.timespan = timespan;
  // this.givenLimit is the limit given to the constructor, this.limit is the
  // functional limit, accounting for this.distFactor.
  this.givenLimit = limit;
  this.factor = factor;
  this.spread = spread;
  this.timespanIndex = Math.ceil(timespan / factor);
  this.total = 0;
  this.time = -1;
  this.buffer = new Array(this.factor + 1).fill(0);

  this.setDistFactor(distFactor);
}
TokenBucket.prototype.setDistFactor = function(distFactor) {
  this.limit = this.givenLimit * distFactor;
  // TODO: this math is ugly and basically wrong
  this.limitPerIndex = Math.floor(this.givenLimit / this.spread / this.factor) * distFactor;
  if (this.limitPerIndex * this.factor < this.limit) // TODO: hack to fix math above
    this.limitPerIndex = Math.ceil(this.limit / this.factor);
};
/** Returns delay in milliseconds or -1 if token available. */
TokenBucket.prototype.getDelay = function() {
  let index = this._update();
  if (this.total < this.limit) {
    if (this.buffer[index] >= this.limitPerIndex)
      return this._getTimeToBucket(1);
    return -1;
  }

  // check how soon into the future old buckets will be zeroed, making requests available.
  let i = 1;
  for (; i < this.buffer.length; i++) {
    if (this.buffer[(index + i) % this.buffer.length] > 0)
      break;
  }
  return this._getTimeToBucket(i);
}
TokenBucket.prototype.getTokens = function(n) {
  let index = this._update();
  this.buffer[index] += n;
  this.total += n;
  return this.total <= this.limit && this.buffer[index] <= this.limitPerIndex;
};
TokenBucket.prototype.toLimitString = function() {
  return this.givenLimit + ':' + (this.timespan / 1000);
};
TokenBucket.prototype._update = function() {
  if (this.time < 0) {
    this.time = this.now();
    return this._getIndex(this.time);
  }

  let index = this._getIndex(this.time);
  let length = this._getLength(this.time, (this.time = this.now()));

  if (length < 0)
    throw new Error('Negative length.');
  if (length == 0)
    return index;
  if (length >= this.buffer.length) {
    this.buffer.fill(0);
    this.total = 0;
    return index;
  }
  for (let i = 0; i < length; i++) {
    index++;
    index %= this.buffer.length;
    this.total -= this.buffer[index];
    this.buffer[index] = 0;
  }
  if (this._getIndex(this.time) != index)
    throw new Error(`Get index time wrong: ${this._getIndex(this.time)}, ${index}.`);
  return index;
};
TokenBucket.prototype._getIndex = function(ts) {
  return Math.floor((ts / this.timespanIndex) % this.buffer.length);
};
TokenBucket.prototype._getLength = function(start, end) {
  return Math.floor(end / this.timespanIndex) - Math.floor(start / this.timespanIndex);
};
TokenBucket.prototype._getTimeToBucket = function(n) {
  return n * this.timespanIndex - (this.time % this.timespanIndex);
};
TokenBucket.getAllOrDelay = function(tokenBuckets) {
  let delay = tokenBuckets
    .map(b => b.getDelay())
    .reduce((a, b) => Math.max(a, b), -1);
  if (delay >= 0)
    return delay;
  tokenBuckets.forEach(b => b.getTokens(1));
  return -1;
};


function Semaphore(count) {
  this.permits = count;
  this.queue = [];
}
Semaphore.prototype.acquire = function() {
  return new Promise(resolve => {
    if (this.permits) {
      this.permits--;
      resolve();
    }
    else
      this.queue.push(resolve);
  });
};
Semaphore.prototype.release = function() {
  const resolve = this.queue.shift();
  (resolve ? resolve() : this.permits++);
};


if (DEBUG) {
  RiotApi.delayPromise = delayPromise;
  RiotApi.TokenBucket = TokenBucket;
}
module.exports = RiotApi;
