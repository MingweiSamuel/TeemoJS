'use strict';

const util = require("util");
const req = require("request-promise-native");
const defaultConfig = require("./defaultConfig.json");

const delayPromise = delay => new Promise(resolve => setTimeout(resolve, delay));
RiotApi.delayPromise = delayPromise;

function RiotApi(key, config = {}) {
  if (!(this instanceof RiotApi)) return new RiotApi(...arguments);
  this.config = JSON.parse(JSON.stringify(RiotApi.defaultConfig));
  this.config.key = key;
  this.regions = {};
  Object.entries(config).forEach(([k, v]) => (this.config[k] = v));
}
RiotApi.prototype.get = function() {
  let region = arguments[0];
  return this._getRegion(region).get(...arguments);
};
/**
 * Limits requests to FACTOR fraction of normal rate limits, allowing multiple
 * instances to be used across multiple processes/machines.
 * This can be called at any time.
 */
RiotApi.prototype.setDistFactor = function(factor) {
  if (factor <= 0 || factor > 1)
    throw new Error("Factor must be greater than zero and non-greater than one.");
  this.config.distFactor = factor;
  Object.values(this.regions).forEach(r => r.updateDistFactor());
};
RiotApi.prototype._getRegion = function(region) {
  if (this.regions[region])
    return this.regions[region];
  return (this.regions[region] = new Region(this.config));
};
RiotApi.defaultConfig = defaultConfig;


/** RateLimits for a region. One app limit and any number of method limits. */
function Region(config) {
  this.config = config;
  this.appLimit = new RateLimit(RateLimit.TYPE_APPLICATION, 1);
  this.methodLimits = {};
  this.liveRequests = 0;
}
Region.prototype.get = function() {
  let region = arguments[0];
  let target = arguments[1];
  let arg, qs;
  if (typeof arguments[2] === 'object')
    qs = arguments[2];
  else {
    arg = arguments[2];
    qs = arguments[3] || {};
  }

  let [endpoint, method] = target.split('.');

  let suffix = this.config.endpoints[endpoint][method];
  if (arg)
    suffix = util.format(suffix, arg);
  let prefix = util.format(this.config.prefix, region);
  let uri = prefix + suffix;

  let methodLimit = this._getMethodLimit(target);
  let rateLimits = [ this.appLimit, methodLimit ];
  let retries = 0;

  let fn = () => {
    let delay = RateLimit.getAllOrDelay(rateLimits);
    if (delay >= 0)
      return delayPromise(delay).then(fn);
    if (this.liveRequests >= this.config.maxConcurrent)
      return delayPromise(20).then(fn);
    this.liveRequests++;
    return req({
      uri, qs,
      forever: true, // keep-alive.
      qsStringifyOptions: { indices: false },
      simple: false,
      resolveWithFullResponse: true,
      headers: { 'X-Riot-Token': this.config.key }
    }).then(res => {
      this.liveRequests--;
      rateLimits.forEach(rl => rl.onResponse(res));
      if ([404, 422].includes(res.statusCode))
        return null;
      if (429 === res.statusCode || 500 <= res.statusCode) {
        if (retries >= this.config.retries)
          throw Error('Failed after ' + retries + ' retries with code ' + res.statusCode + '.');
        retries++;
        return fn();
      }
      return JSON.parse(res.body);
    });
  };
  return Promise.resolve(fn());
};
Region.prototype.updateDistFactor = function() {
  this.appLimit.setDistFactor(this.config.distFactor);
  Object.values(this.methodLimits).forEach(rl => rl.setDistFactor(this.config.distFactor));
};
Region.prototype._getMethodLimit = function(method) {
  if (this.methodLimits[method])
    return this.methodLimits[method];
  return (this.methodLimits[method] = new RateLimit(RateLimit.TYPE_METHOD, 1));
};


/** Rate limit. A collection of token buckets, updated when needed. */
function RateLimit(type, distFactor) {
  this.type = type;
  this.buckets = [ new TokenBucket(1000, 1, { factor: 1, spread: 0 }) ];
  this.retryAfter = 0;
  this.distFactor = distFactor;
}
RateLimit.prototype.retryDelay = function() {
  let now = Date.now();
  return now > this.retryAfter ? -1 : this.retryAfter - now;
};
RateLimit.prototype.onResponse = function(res) {
  if (429 === res.statusCode) {
    let type = res.headers[RateLimit.HEADER_LIMIT_TYPE];
    if (!type)
      throw new Error('Response missing type.');
    if (this.type.name === type.toLowerCase()) {
      let retryAfter = +res.headers[RateLimit.HEADER_RETRY_AFTER];
      if (Number.isNaN(retryAfter))
        throw new Error('Response 429 missing retry-after header.');
      this.retryAfter = Date.now() + retryAfter * 1000 + 500;
    }
  }

  let limitHeader = res.headers[this.type.headerLimit];
  let countHeader = res.headers[this.type.headerCount];
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
    throw new Error('Limit and count headers do not match: ' + limitHeader + ', ' + countHeader + '.');

  return limits
    .map((limit, i) => {
      let count = counts[i];
      let [limitVal, limitSpan] = limit.split(':').map(Number);
      let [countVal, countSpan] = count.split(':').map(Number);
      limitSpan *= 1000;
      countSpan *= 1000;
      if (limitSpan != countSpan)
        throw new Error('Limit span and count span do not match: ' + limitSpan + ', ' + countSpan + '.');

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
/** Header specifying which RateLimitType caused a 429. */
RateLimit.HEADER_LIMIT_TYPE = "x-rate-limit-type";
/** Header specifying retry after time in seconds after a 429. */
RateLimit.HEADER_RETRY_AFTER = "retry-after";
RateLimit.TYPE_APPLICATION = {
  name: 'application',
  headerLimit: 'x-app-rate-limit',
  headerCount: 'x-app-rate-limit-count'
};
RateLimit.TYPE_METHOD = {
  name: 'method',
  headerLimit: 'x-method-rate-limit',
  headerCount: 'x-method-rate-limit-count'
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
    throw new Error('Get index time wrong:' + this._getIndex(this.time) + ', ' + index + '.');
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
RiotApi.TokenBucket = TokenBucket;

module.exports = RiotApi;
