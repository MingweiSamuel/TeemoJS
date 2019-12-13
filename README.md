<h1 align="center">
  TeemoJS
</h1>
<p align="center">
  <a href="https://github.com/MingweiSamuel/TeemoJS/"><img src="https://cdn.communitydragon.org/latest/champion/Teemo/square" width="20" height="20" alt="Github"></a>
  <a href="https://www.npmjs.com/package/teemojs"><img src="https://img.shields.io/npm/v/teemojs.svg?style=flat-square&logo=npm" alt="NPM"></a>
  <a href="https://packagephobia.now.sh/result?p=teemojs%40next"><img src="https://flat.badgen.net/packagephobia/install/teemojs@next" alt="Install Size"></a>
  <a href="https://bundlephobia.com/result?p=teemojs%40next"><img src="https://flat.badgen.net/bundlephobia/min/teemojs%40next" alt="Minified Size"></a>
</p>

TeemoJS is a fast and lightweight Riot API wrapper written in Javascript,
with additional support for DDragon, CDragon, and
[meraki-analytics/kernel](https://github.com/meraki-analytics/kernel).
Contained in about 400 lines, it has a minimalist design to make it flexible and easy to maintain.

Features:

- Fast & Efficient Rate Limiting
- Automatic Retries

It is up to the developer to do the rest.

TeemoJS supports the new TFT APIs.

## Installation

```sh
npm install --save teemojs
```

## Usage

### Example
```javascript
const TeemoJS = require('teemojs');
const api = TeemoJS('RGAPI-KEY-HERE');

async function main() {
  const summoner = await api.req('na', 'lol.summonerV4.getBySummonerName', 'x blotter')
  console.log(`${summoner.name}'s account id is ${summoner.accountId}.`);

  // Get summoner's games on Teemo and Illaoi for a particular season.
  const matchlist = await api.req('na', 'lol.matchV4.getMatchlist', summoner.accountId, { champion: [ 17, 420 ] });
  console.log(`Fetched ${matchlist.matches.length} games.`);

  // ...
}

main();
```

### Syntax

Requests are done via `.req(...)`, which returns a promise.
```javascript
dataPromsie = api.req(platform, endpointPath[, pathParams[, queryParams[, bodyParam]]]);
```

#### Parameters
- `platform`*  
  The region to request to. This is:
  - A region `string` such as `'na'`, `'euw'`, (on some endpoints) `'americas'`, etc.

- `endpointPath`  
  The endpoint path, such as `'lol.matchV4.getMatch'`. These can by found in the
  [config file](https://github.com/MingweiSamuel/TeemoJS/blob/master/defaultConfig.json)
  or by looking at the hash (`#`) in the API reference URL, such
  as in [/apis#match-v4/GET_getMatch](https://developer.riotgames.com/apis#match-v4/GET_getMatch).
  This is:
  - A `string`, such as `'lol.matchV4.getMatch'` or `'tft.matchV1.getMatchIdsByPUUID'`.

- `pathParams` (optional for some endpoints)  
  Path parameters for the request. This must match the path params. This is:
  - An `Array` with values corresponding to each path param. Values will be interpolated in order.
  - An `object` with keys corresponding to each path param. Values will be interpolated by name (object key).
  - A single value for endpoints needing exactly one path param. Non-`string` values will be converted to `string`.
  - `[]`, `{}`, or `undefined` for endpoints needing no path params.

- `queryParams` (optional for some endpoints)  
  Query parameters (AKA GET or search parameters) for the request. This is:
  - An `object` with entries specifying query parameters. The value for a key may be a single value, or a list of values.
  - `{}` or `undefined` for no query params.

- `bodyParam` (optional for most endpoints)  
  Body parameter for POST, PUT requests in the tournament APIs. This is:
  - A JSON value (`object`, `Array`, `string`, etc.) which will be `JSON.stringify`ed into the request body.
  - `undefined` for no body param.

<sup>*Note: platform should be omitted if using a non-Riot API that doesn't use platforms/regions.</sup>

#### Return Value
- `dataPromise`  
  The data returned by the Riot API. This is the `JSON.parse`d body of the response. This is:
  - A `Promise` resolving to a JSON value (`object`, `Array`, `string`, etc.) parsed from the response body.
  - A `Promise` resolving to `null` if the response had no body (status code 204, 404, 422).
  - A `Promise` rejecting with an `Error`. The `Error` may have a `.response` field containing the failed repsonse.

#### Throws
Throws an `Error` if the request could not be made. This happens when the `endpointPath` and/or `*params` were
missing or invalid.

### In-Browser
After `npm install`ing, `node_modules/teemojs/dist/browser.js` contains a browserified version of TeemoJS.

Usable with `TeemoJS.ddragonConfig`, `TeemoJS.cdragonConfig`, and `TeemoJS.kernelConfig`
([meraki-analytics/kernel](https://github.com/meraki-analytics/kernel)). (`defaultConfig` will not work due to CORS).

This is mainly intended for development, and it uses ES6 features.
For production, you should include `src/index.js` and your needed config(s)
(`config/<config>.json`) in your webpack or other bundle.

### Other useful APIs/configurations

#### Riot API with separate key for TFT endpoints
```javascript
// Makes a deep copy to not modify the original (optional).
const config = JSON.parse(JSON.stringify(TeemoJS.defaultConfig));
config.key = riotApiKey;
config.endpoints.tft['*'] = { key: tftApiKey }; // Use tftApiKey for tft endpoints.
const api = TeemoJS(config);
// Use as normal.
```

#### Data Dragon: `TeemoJS.ddragonConfig`
```javascript
const api = TeemoJS(TeemoJS.ddragonConfig);
const data = await api.req('cdn.championByKey', [ version, 'en_US', 'Teemo' ]);
```

#### Community Dragon: `TeemoJS.cdragonConfig`
```javascript
const api = TeemoJS(TeemoJS.cdragonConfig);
const data = await api.req('cdn.champion', { patch: 'latest', champion: 'monkeyking' });
```

#### meraki-analytics/kernel: `TeemoJS.kernelConfig`
Local development on port 8080:
```javascript
// Make a deep copy to not modify the original (optional).
const config = JSON.parse(JSON.stringify(TeemoJS.kernelConfig));
config.origin = "http://localhost:8080"
const api = TeemoJS(config);
// Use as normal.
```


## Configuration

The `TeemoJS` constructor can take an second argument which is a configuration object.
You should use `TeemoJS.defaultConfig` (or a different available configuration)
as a starting point and override any fields as neccesary.

### Available configurations
- [`TeemoJS.defaultConfig`](https://github.com/MingweiSamuel/TeemoJS/blob/master/config/default.json):  
  Default Riot Games API config.
- [`TeemoJS.emptyConfig`](https://github.com/MingweiSamuel/TeemoJS/blob/master/config/empty.json):  
  Empty (no endpoints) Riot Games API config. Probably not that useful.
- [`TeemoJS.ddragonConfig`](https://github.com/MingweiSamuel/TeemoJS/blob/master/config/ddragon.json):  
  Data Dragon config ([example](http://ddragon.leagueoflegends.com/cdn/9.7.1/data/cs_CZ/champion/Amumu.json)).
- [`TeemoJS.cdragonConfig`](https://github.com/MingweiSamuel/TeemoJS/blob/master/config/cdragon.json):  
  Community Dragon config ([example](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/
- [`TeemoJS.kernelConfig`](https://github.com/MingweiSamuel/TeemoJS/blob/master/config/kernel.json):  
  [meraki-analytics/kernel](https://github.com/meraki-analytics/kernel) config. Allows you to use `kernel` as an API
  proxy while still having TeemoJS's familiar interface in your browser webpage. Must set `origin` to wherever
  kernel is running on.
- ~~TeemoJS.championGGConfig~~ (RIP).
- (More in the future?)

### Example constructors with `config`
```javascript
let api = TeemoJS('RGAPI-KEY-HERE', { ...TeemoJS.defaultConfig, maxConcurrent: 100 });
let api = TeemoJS(configWithKey);
```

### `config` Object

- `retries` [int]: Number of times to retry request if the request fails with a retriable error. Zero for no retires.
- `maxConcurrent` [int]: Maximum live requests to allow simultaneously.
- `distFator` [float 0..1]: Factor to multiply rate limits by. This can be changed at any time using the `api.setDistFactor(x)` method. For example, if your API key was distributed across two computers, you could set this to 0.5.
- `key` [OPTIONAL string]: Overrides the `key` argument passed into the constructor. Do not set unless you actually use this key.

#### Rate limit configuration

- `bucketsConfig` [object]: Arguments passed into `TokenBucket` constructor when rate limits are first detected (or
  change). May have any subset of the following fields:
  - `bins` [OPTIONAL integer, default 20]: Number of bins to compute circular buffer with.
  - `binFactor` [OPTIONAL number in `(0, 1]`, default 0.95): Fraction of requests that can go in each bin. 0.95 means 95% of
    requests can be bursted in one bin (the remaining 5% can be used in the next bin). Must be in range.
  - `overhead` [OPTIONAL number (milliseconds), default 20ms): Time in milliseconds to expand the bucket by. Helps deal
    with latency causing requests to be counted in the wrong bucket. Increase this if you are getting 429s when time
    changes from one bucket to the next.

#### "Internal" configurations

The following properties are mainly used for _dealing_ with all the different behaviors of the different APIs.
A lot of their exact behaviors are "self-documented" in the code :).

- `keyPath` \[OPTIONAL string\]: JSON path the key will be inserted into in the `reqConfig`. Or `null` if no key needed.
- `origin` \[interpolated string\]: String containing the protocol and host without a trailing forward slash. May have `{}`
  `{name}`s for `originParams`.
- `regionPath` \[OPTIONAL string\]: JSON path the region will be inserted into in the `reqConfig`. Or `null` if no region needed.
- `defaultBuckets` \[object\[\]\]: Array of configuration options for a rate limit's default buckets. These buckets remain in use until the actual rate limit is detected via headers. Each must have at least `timespan` (in milliseconds) and `limit`.
- `rateLimitTypeApplication` \[object\]: Rate limit type object for the application rate limit.
  Containing strings `name`, `headerLimit`, and `headerCount`.
  `name` is the name of the rate limit used for detecting which type caused a 429.
  `headerLimit` and `headerCount` are header names for the max rate limit and rate limit count respectively.
- `rateLimitTypeMethod` \[object/null\]: Same as `rateLimitTypeApplication` but for method rate limits. May be null if the API does not have per-method rate limits.
- `defaultRetryAfter` [string/null]: Default retry after in seconds if the `headerRetryAfter` is not provided in a 429. Use `null` to cause missing `headerRetryAfter` headers to throw an error.
- `headerRetryAfter` [string/null]: Header name to look for retry after time in seconds when a 429 is hit.
  If `null`, `defaultRetryAfter` should be set.
- `headerLimitType` [string/null]: Header name to match with the `name` of a rateLimitType to determine which rate
  limit hit a 429. `null` means always use `defaultLimitType`.
- `defaultLimitType` [string/null]: Default `name` value to use when the API doesn't return which limit is hit.
  Set to `null` to throw an error if a 429 happens for no reason. Set to `rateLimitTypeXYZ.name` to default to rate limit type XYZ.
- `collapseQueryArrays` [boolean]: If `false`, query arrays will be represented as `a=1&a=2&a=3`.
  If `true`, `a=1,2,3` will be used. Riot API uses the former, champion.gg used the later (but is dead).
- `endpoints` [nested object]: A nested object structure where the leaf values are `reqConfig`s.
  Objects may be nested to any level for organizational purposes.
  When using the API, the period-delimited path is supplied.
  Can use `'*'` wildcards for config to apply to multiple endpoints.
  - `path` \[interpolated string\]: URL path with leading slash. Technically optional but that would be silly.
  - `fetch`: [Fetch API `init` config](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters),
    second argument passed into `fetch` function.
  - `key` \[OPTIONAL string\]: Per-endpoint(s) API key. Useful for using separate key for certain (*cough* TFT) endpoints.
  - `origin` \[OPTIONAL string\]: URL origin (protocol and hostname).
  - `originParams` \[OPTIONAL object or array\]: for interpolating `origin`.
  - `pathParams` \[OPTIONAL object or array\]: should probably be unset, as will be partially overriden by `req` arguments.
  - `queryParams` \[OPTIONAL object\].
  - (Other fields?)
