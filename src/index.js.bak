'use strict';

/** True if running in tests. */
const DEBUG = /test[\\\/][-\w]+\.js$/.test(module.parent && module.parent.filename);

// Load dependencies.
const fetch = global.fetch || require(`${'node-fetch'}`);
const URL   = global.URL   || require(`${'url'}`).URL;

// Assign configurations.
TeemoJS.emptyConfig   = require('../config/empty.json');
TeemoJS.defaultConfig = require('../config/default.json');
TeemoJS.kernelConfig  = require('../config/kernel.json');
TeemoJS.ddragonConfig = require('../config/ddragon.json');
TeemoJS.cdragonConfig = require('../config/cdragon.json');


/** Returns a formatted string, replacing "{}" or "{name}" with supplied ARGOBJECT.
  * ARGOBJECT may be an object or Array. */
function format(format, argObject) {
  let i = 0;
  const result = format.replace(/\{(\w*)\}/g, (_, key) => {
    let val = undefined !== argObject[key] ? argObject[key] : argObject[i++];
    if (undefined === val) throw new Error(`Argument provided for format "${format}" missing key "{${key}}".`);
    return val;
  });
  return result;
}

/** Returns a promise that resolves after the supplied delay. */
function delayPromise(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

const objFromEntries = Object.fromEntries || function(entries) {
  const obj = {};
  entries.forEach(([ key, val ]) => obj[key] = val);
  return obj;
};

/** Assigns VALUE into OBJECT at location PATH, where PATH is a period-dilimited set of segments. For example,
  * `"foo.bar"` would run `object.foo.bar = value`. But also fills in falsy values with new objects. */
function assignPath(object, path, value) {
  const segments = path.split('.');
  const final = segments.pop();
  for (const segment of segments)
    object = object[segment] || (object[segment] = {});
  object[final] = value;
}


/** `TeemoJS(key [, config])` or `TeemoJS(config)` with `config.key` set. */
function TeemoJS(key, config = TeemoJS.defaultConfig) {
  if (!(this instanceof TeemoJS)) return new TeemoJS(...arguments);
  if (key instanceof Object)
    config = key;
  else
    config.key = key;

  this.config = config;
  this.regions = {}; // Map: Key -> Platform -> RegionalRequester.
}
TeemoJS.prototype.req = function(...args) {
  // Get region (first arg, or not).
  let region = this.config.regionPath ? args.shift() : null;
  let [ target, pathParams = {}, queryParams = {}, bodyParam = undefined ] = args;

  // Get reqConfigs.
  const reqConfigs = [];
  let endpointTree = this.config.endpoints;
  for (const segment of target.split('.')) {
    if (endpointTree['*']) reqConfigs.push(endpointTree['*'])
    if (!(endpointTree = endpointTree[segment])) throw new Error(`Missing path segment "${segment}" in "${target}".`);
  }
  reqConfigs.push(endpointTree);
  // Assemble reqConfig.
  const reqConfig = Object.assign({}, ...reqConfigs);
  if (typeof reqConfig.path !== 'string') throw new Error(`Failed to find path for target: "${target}".`);
  reqConfig.fetch = Object.assign({ keepalive: true, redirect: 'follow', headers: {} }, ...reqConfigs.map(rc => rc.fetch));
  reqConfig.fetch.headers = Object.assign({}, ...reqConfigs.map(rc => rc.fetch && rc.fetch.headers));
  reqConfig.pathParams = Object.assign({}, ...reqConfigs.map(rc => rc.pathParams), pathParams);
  reqConfig.queryParams = Object.assign({}, ...reqConfigs.map(rc => rc.queryParams), queryParams);
  reqConfig.bodyParam || (reqConfig.bodyParam = bodyParam);
  // Override key.
  const key = reqConfig.key || this.config.key || null;
  if (this.config.keyPath) assignPath(reqConfig, this.config.keyPath, key);
  // Lookup regions.
  if (this.config.regionPath) {
    if (!reqConfig.regionTable[region]) throw new Error('Failed to determine platform for region: ' +
      `"${region}", available regions (for this endpoint): ${Object.keys(reqConfig.regionTable).join(', ')}.`)
    assignPath(reqConfig, this.config.regionPath, reqConfig.regionTable[region]);
  }

  // OriginParams. But first override origin.
  let origin = reqConfig.origin || this.config.origin;
  if (reqConfig.originParams) origin = format(origin, reqConfig.originParams);

  // PathParams. Interpolate path.
  if (Array.isArray(pathParams)) // Array.
    pathParams = pathParams.map(encodeURIComponent);
  else if (typeof pathParams === 'object') // Object dict.
    pathParams = objFromEntries(Object.entries(pathParams).map(([ key, val ]) => [ key, encodeURIComponent(val) ]));
  else // Single value.
    pathParams = [ pathParams ];
  const path = format(reqConfig.path, pathParams);

  // QueryParams. First build URL.
  const urlBuilder = new URL(path, format(origin, [ region ]));
  // Then build URL query params.
  for (const [ key, vals ] of Object.entries(reqConfig.queryParams)) {
    if (!Array.isArray(vals)) // Not array.
      urlBuilder.searchParams.set(key, vals);
    else if (this.config.collapseQueryArrays) // Array, collapse.
      urlBuilder.searchParams.set(key, vals.join(','));
    else // Array, do not collapse.
      vals.forEach(val => urlBuilder.searchParams.append(key, val));
  }

  // BodyParam. Add body, if supplied, to reqConfig.fetch.
  if (undefined !== bodyParam) {
    reqConfig.fetch.body = JSON.stringify(bodyParam);
    reqConfig.fetch.headers['Content-Type'] = 'application/json';
  }

  return this._getRegion(region).req(target, urlBuilder.href, reqConfig.fetch);
};
/** Limits requests to FACTOR fraction of normal rate limits, allowing multiple
  * instances to be used across multiple processes/machines.
  * This can be called at any time. */
TeemoJS.prototype.setDistFactor = function(factor) {
  if (factor <= 0 || factor > 1) throw new Error("Factor must be greater than zero and non-greater than one.");
  if (this.config.distFactor === factor) return;
  this.config.distFactor = factor;
  Object.values(this.regions).forEach(keyRegions => Object.values(keyRegions).forEach(r => r.updateDistFactor()));
};
TeemoJS.prototype._getRegion = function(key, region) {
  const keyRegions = this.regions[key] || (this.regions[key] = {});
  return keyRegions[region] || (keyRegions[region] = new Region(this.config, region));
};


/** Regional Requester. Handles `RateLimit`s for a region. One app limit and multiple method limits. */
function Region(config) {
  this.config = config;
  this.appLimit = new RateLimit(this.config.rateLimitTypeApplication, 1, this.config);
  this.methodLimits = {};
  this.concurrentSema = new Semaphore(this.config.maxConcurrent);
}
Region.prototype.req = function(target, url, fetchConfig) {
  // Get rate limits to obey.
  let rateLimits = [ this.appLimit ];
  if (this.config.rateLimitTypeMethod) // Also method limit if applicable.
    rateLimits.push(this._getMethodLimit(target));

  return (async () => {
    let response, delay, retries;
    // Fetch retry loop.
    for (retries = 0; retries < this.config.retries; retries++) {
      // Acquire concurrent request permit.
      // Note: This includes the time spent waiting for rate limits. To obey the rate limit we need to send the request
      //       immediately after delaying, otherwise the request could be delayed into a different bucket.
      await this.concurrentSema.acquire();
      try {
        // Wait for rate limits.
        while (0 <= (delay = RateLimit.getAllOrDelay(rateLimits)))
          await delayPromise(delay);
        // Send request, get response.
        response = await fetch(url, fetchConfig);
      }
      finally {
        // Release concurrent request permit.
        // Note: This may be released before the full response body is read.
        this.concurrentSema.release();
      }

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
    const err = new Error(`Request failed after ${retries} retries with code ${response.status}. ` +
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
  return this.methodLimits[method] ||
    (this.methodLimits[method] = new RateLimit(this.config.rateLimitTypeMethod, 1, this.config));
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
    this.buckets = RateLimit._getBucketsFromHeaders(limitHeader, countHeader, this.config.bucketsConfig);
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
RateLimit._getBucketsFromHeaders = function(limitHeader, countHeader, bucketsConfig = {}) {
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

      let bucket = new TokenBucket(limitSpan, limitVal, { distFactor: this.distFactor, ...bucketsConfig });
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

/** Token bucket. Represents a single "100:60", AKA a 100 tokens per 60 seconds pair.
  * `bins`: Number of discrete bins to count into per timespan. `limit * binFactor` tokens alloted per bin.
  * `binFactor`: Value in range (0, 1], representing the fraction of `limit` requests allowed per bin.
  * `Overhead`: Time to extend `timespan` by in milliseconds. This is to prevent literal edge cases where requests can
  *             be counted into the wrong bucket, causing 429s.
  * `now`: Function which returns millisecond time.
  * `distFactor`: Value in range (0, 1] representing the fraction of the total rate limit this instance can use. */
function TokenBucket(timespan, limit,
    { distFactor = 1, bins = 20, binFactor = 0.95, overhead = 20 } = {}, now = Date.now) {
  if (binFactor <= 0 || 1 < binFactor) throw new Error(`binFactor ${binFactor} must be in range (0, 1].`);
  this.now = now;
  // Given values for checking equality when updating buckets.
  this.givenTimespan = timespan;
  this.givenLimit = limit;
  // Configuration values (rarely change).
  this.binFactor = binFactor;
  this.timespan = timespan + overhead;
  this.binTimespan = Math.ceil(this.timespan / bins); // Timespan per bin.
  // Fields that track requests, (change frequently).
  this.total = 0;
  this.time = -1;
  this.buffer = new Array(bins + 1).fill(0);

  this.setDistFactor(distFactor);
}
TokenBucket.prototype.setDistFactor = function(distFactor) {
  this.limit = this.givenLimit * distFactor;
  this.binLimit = Math.max(1, Math.floor(this.limit * this.binFactor));
};
/** Returns delay in milliseconds or -1 if token available. */
TokenBucket.prototype.getDelay = function() {
  let index = this._update();
  if (this.total < this.limit) {
    if (this.buffer[index] >= this.binLimit)
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
  return this.total <= this.limit && this.buffer[index] <= this.binLimit;
};
TokenBucket.prototype.toLimitString = function() {
  return this.givenLimit + ':' + (this.givenTimespan / 1000);
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
  return Math.floor((ts / this.binTimespan) % this.buffer.length);
};
TokenBucket.prototype._getLength = function(start, end) {
  return Math.floor(end / this.binTimespan) - Math.floor(start / this.binTimespan);
};
TokenBucket.prototype._getTimeToBucket = function(n) {
  return n * this.binTimespan - (this.time % this.binTimespan);
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
  TeemoJS.delayPromise = delayPromise;
  TeemoJS.TokenBucket = TokenBucket;
  TeemoJS.Semaphore = Semaphore;
}
module.exports = TeemoJS;
