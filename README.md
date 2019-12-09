<h1 align="center">
  TeemoJS
</h1>
<p align="center">
  <a href="https://github.com/MingweiSamuel/TeemoJS/"><img src="https://cdn.communitydragon.org/latest/champion/Teemo/square" width="20" height="20" alt="Github"></a>
  <a href="https://www.npmjs.com/package/teemojs"><img src="https://img.shields.io/npm/v/teemojs.svg?style=flat-square&logo=npm" alt="NPM"></a>
  <a href="https://packagephobia.now.sh/result?p=teemojs%40next"><img src="https://flat.badgen.net/packagephobia/install/teemojs@next" alt="Install Size"></a>
  <a href="https://bundlephobia.com/result?p=teemojs%40next"><img src="https://flat.badgen.net/bundlephobia/min/teemojs%40next" alt="Minified Size"></a>
</p>

TeemoJS is a fast and lightweight Riot API wrapper written in Node.js.
Contained in about 300 lines,
it has a minimalist design to make it flexible and easy to maintain.
There is a specific set of things TeemoJS aims to do, and it aims to do them well:

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
```js
const TeemoJS = require('teemojs');
const api = TeemoJS('RGAPI-KEY-HERE');

async function main() {
  const summoner = await api.get('na1', 'summonerV4.getBySummonerName', 'x blotter')
  console.log(`${summoner.name}'s account id is ${summoner.accountId}.`);

  // Get summoner's games on Teemo and Illaoi for a particular season.
  const matchlist = await api.get('na1', 'matchV4.getMatchlist', summoner.accountId, { champion: [ 17, 420 ] });
  console.log(`Fetched ${matchlist.matches.length} games.`);

  // ...
}

main();
```

### Syntax

Requests are done via `.send(...)`, which returns a promise.
```js
dataPromsie = api.send(platform, endpointPath[, pathParams[, queryParams[, bodyParam]]]);
```

#### Parameters
- `platform`*  
  The regional platform to request to. This is:
  - A `string` such as `'na1'`, `'euw1'`, or `'americas'`.

- `endpointPath`  
  The endpoint path, such as `'matchV4.getMatch'`. These can by found in the
  [config file](https://github.com/MingweiSamuel/TeemoJS/blob/master/defaultConfig.json)
  or by looking at the hash (`#`) in the API reference URL, such
  as in [/apis#match-v4/GET_getMatch](https://developer.riotgames.com/apis#match-v4/GET_getMatch).
  This is:
  - A `string`, such as `'matchV4.getMatch'` or `'tftMatchV1.getMatchIdsByPUUID'`.

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


## Configuration

The `TeemoJS` constructor can take an second argument which is a configuration object.
[`defaultConfig.json`](https://github.com/MingweiSamuel/TeemoJS/blob/master/defaultConfig.json)
is used by default. The supplied `config` object will override any corresponding values in the `defaultConfig`.
The configuration specifies the number of retries and maximum concurrent requests, as well as the Riot API
endpoint URLs.

### Constructors with `config`
```node
let api = TeemoJS('RGAPI-KEY-HERE', config);
let api = TeemoJS(configWithKey);
```

### `config` Object

- `retries` [int]: Number of times to retry request if the request fails with a retriable error. Zero for no retires.
- `maxConcurrent` [int]: Maximum live requests to allow.
- `distFator` [float 0..1]: Factor to multiply rate limits by. This can be changed at any time using the `api.setDistFactor(x)` method. For example, if your API key was distributed across two computers, you could set this to 0.5.
- `key` [OPTIONAL string]: Overrides the `key` argument passed into the constructor. Do not set unless you actually use this key.

Only modify the following properties if you know what you're doing. This is mainly documentation for future reference.

- `origin` [interpolated string]: String containing the protocol and host without a trailing forward slash. May have one `%s` for the region or none if the API has no separate regions.
- `defaultBuckets` [object[]]: Array of configuration options for a rate limit's default buckets. These buckets remain in use until the actual rate limit is detected via headers. Each must have at least `timespan` (in milliseconds) and `limit`.
- `rateLimitTypeApplication` [object]: Rate limit type object for the application rate limit. Containing strings `name`, `headerLimit`, and `headerCount`. `name` is the name of the rate limit used for detecting which type caused a 429. `headerLimit` and `headerCount` are header names for the max rate limit and rate limit count respectively.
- `rateLimitTypeMethod` [object/null]: Same as `rateLimitTypeApplication` but for method rate limits. May be null if the API does not have per-method rate limits.
- `defaultRetryAfter` [string/null]: Default retry after in seconds if the `headerRetryAfter` is not provided in a 429. Use `null` to cause missing `headerRetryAfter` headers to throw an error.
- `headerRetryAfter` [string/null]: Header name to look for retry after time in seconds when a 429 is hit. If `null`, `defaultRetryAfter` should be set.
- `headerLimitType` [string/null]: Header name to match with the `name` of a rateLimitType to determine which rate limit hit a 429. `null` always use `defaultLimitType`.
- `defaultLimitType` [string/null]: Default `name` value to use when the API doesn't return which limit is hit. Set to `null` to throw an error if a 429 happens for no reason. Set to `rateLimitTypeXYZ.name` to default to rate limit type XYZ.
- `keyHeader` [string/null]: Name of header to put key in or `null` to use query parameters.
- `keyQueryParam` [string/null]: Name of query parameter to put key in. `keyHeader` must be set to `null` for this to be used.
- `collapseQueryArrays` [boolean]: If `false`, query arrays will be represented as `a=1&a=2&a=3`. If `true`, `a=1,2,3` will be used. Riot API uses the former, champion.gg uses the later.
- `endpoints` [nested object]: A (optionally) nested object structure where the leaf values are API endpoint URLs with leading forward slashes. Objects may be nested to any level for organizational purposes. When using the API, the period-delimited path is supplied.

## Setting `defaultConfig` & Other premade configurations

`defaultConfig` is stored in the `TeemoJS.defaultConfig` property and can be changed if needed.

There are three more premade configurations provided:
- [`TeemoJS.emptyConfig`](https://github.com/MingweiSamuel/TeemoJS/blob/master/emptyConfig.json)
is the same as `TeemoJS.defaultConfig` but without any `endpoints`.
- [`TeemoJS.championGGConfig`](https://github.com/MingweiSamuel/TeemoJS/blob/master/championGGConfig.json)
is a configuration for the [Champion.GG API](http://api.champion.gg/). Oh, by the way, TeemoJS also supports the Champion.GG API.
- (`TeemoJS.ddragonConfig` TODO)

Champion.GG Example:
```node
let api = TeemoJS('cgg0api0key', TeemoJS.championGGConfig);
api.get('champion.getChampion', 143)
  .then(data => console.log("Zyra's winrate as " + data[0].role + ' is ' + data[0].winRate + '.'));
```
