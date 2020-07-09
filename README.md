<h1 align="center">
  Teemo(J)S
</h1>
<p align="center">
  <a href="https://github.com/MingweiSamuel/TeemoJS/"><img src="https://cdn.communitydragon.org/latest/champion/Teemo/square" width="20" height="20" alt="Github"></a>
  <a href="https://www.npmjs.com/package/teemojs"><img src="https://img.shields.io/npm/v/teemojs.svg?style=flat-square&logo=npm" alt="NPM"></a>
  <a href="https://packagephobia.now.sh/result?p=teemojs%40next"><img src="https://flat.badgen.net/packagephobia/install/teemojs@next" alt="Install Size"></a>
  <a href="https://bundlephobia.com/result?p=teemojs%40next"><img src="https://flat.badgen.net/bundlephobia/min/teemojs%40next" alt="Minified Size"></a>
</p>

Teemo(J)S is a fast, lightweight, and fully-typed Riot API wrapper written in
TypeScript,
<!-- with additional support for DDragon, CDragon, and
[meraki-analytics/kernel](https://github.com/meraki-analytics/kernel). -->
Contained in about 500 lines, it has a minimalist design to make it flexible
and easy to maintain.

Features:

- Fast, efficient, correct rate limiting.
- Automatic retries.
- TypeScript typings:
  - Argument & region type checking on API calls.
  - Fully-typed response DTOs, supporting `strictNullChecks`.
- Up-to-date (or if not, [make an issue!](https://github.com/MingweiSamuel/TeemoJS/issues/new?title=Update+needed&body=%3CSOMETHING%3E+is+missing.)).

## Installation

```sh
npm install --save teemojs
```

## Usage

### Example
```javascript
const { TeemoApi, Region } = require('teemojs');
const api = TeemoApi.createRiotApi('RGAPI-KEY-HERE').proxy();

async function main() {
  const summoner = await api.summonerV4.getBySummonerName(Region.NA1, {
    path: { summonerName: 'x blotter' },
  });
  console.log(`${summoner.name}'s account id is ${summoner.accountId}.`);

  // Get summoner's games on Teemo and Illaoi for a particular season.
  const matchlist = await api.matchV4.getMatchlist(Region.NA1, {
    path: [ summoner.accountId ],
    query: { champion: [ 17, 420 ] },
  });
  console.log(`Fetched ${matchlist.matches.length} games.`);

  // ...
}

main();
```

### Syntax

There are two equivalent syntaxes:
- `req` syntax, all API calls are done via the `.req(endpoint, method, ...)` method.
- `proxy` syntax, endpoints and methods can be called as fields and methods
  respectively.

The later uses [`Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
to call the former.


**`req` syntax:**
```javascript
const api = TeemoApi.createRiotApi('RGAPI-KEY-HERE');
aPromise = api.req(endpoint, method, region, {
  path: pathParams,
  query: queryParams,
  body: bodyParam,
});
```
**`proxy` syntax:**
```javascript
const api = TeemoApi.createRiotApi('RGAPI-KEY-HERE')
    .proxy(); // Convert to proxy.
aPromise = api.endpoint.method(region, {
  path: pathParams,
  query: queryParams,
  body: bodyParam,
});
```

#### Parameters
- `endpoint` - An API endpoint in lower camel case, such as `summonerV4` or
  `matchV4`.
- `method` - An method in `endpoint`, such as `getBySummonerName` or
  `getMatchlist` (respectively).
  - See [`configs.ts`](https://github.com/MingweiSamuel/TeemoJS/blob/master/src/configs.ts)
  for a full list of endpoints and methods.
- `region` - The region to request to, from the `Region` enum (`Region.NA1`) or
  a string.
- The parameters object. This can be omitted if no parameters are needed, e.g.
  for `lolStatusV3` `getShardData`.
  - `path` - If needed, an array or object dictionary of parameters. For the
    dictionary, key names must match the `{pathParam}` names (no curly braces).
  - `query` - If needed, an object dictionary of query parameter names mapping
    to values or arrays of values.
  - `body` - If needed, a JSON value, to be serialized.

#### Return Value & Error Handling
Returns `dataPromise`, the data returned by the Riot API. This is the
`JSON.parse`d body of the response. This is:
- A `Promise` resolving to the JSON value parsed from the response body on
  success.
- A `Promise` resolving to `null` if the response had no body (status code 204,
  404, 422).
- A `Promise` rejecting with an `Error`. If a response was received, the
  `Error` will have a `.response` field containing the failed repsonse.

Throws an `Error` immediately (synchronously) if the request could not be made.
This happens if the `endpoint`, `method` pair were invalid, or path parameters
were missing.

### In-Browser
After `npm install`ing, `node_modules/teemojs/dist/browser.js` contains a
browser-ready version of TeemoJS. However, the Riot Games API does not support
cross-origin requests (CORS), so you will need to configure a proxy such as
[meraki-analytics/kernel](https://github.com/meraki-analytics/kernel). There is
currently no out-of-the-box config for this, but it is planned.

<!--Usable with `TeemoJS.ddragonConfig`, `TeemoJS.cdragonConfig`, and `TeemoJS.kernelConfig`
([meraki-analytics/kernel](https://github.com/meraki-analytics/kernel)). (`defaultConfig` will not work due to CORS).

This is mainly intended for development, and it uses ES6 features.
For production, you should include `src/index.js` and your needed config(s)
(`config/<config>.json`) in your webpack or other bundle.-->

### Other features

#### Riot API with separate keys for TFT/LOR/Tournament APIs

```javascript
const api = TeemoApi.createRiotApi({
  default: 'RGAPI-LOL-KEY-HERE',
  tft: 'RGAPI-OPTIONAL-TFT-KEY-HERE',
  lor: 'RGAPI-OPTIONAL-LOR-KEY-HERE',
  tournament: 'RGAPI-OPTIONAL-TOURNAMENT-KEY-HERE',
});
// Use as normal.
```

#### TypeScript typings

```typescript
import { TeemoApi, Region, summonerV4, matchV4 } from "./dist/index";
// ...
const summoner: summonerV4.SummonerDTO = await api.summonerV4.getBySummonerName(Region.NA1, {
  path: { summonerName: 'x blotter' },
});
const matchlist: matchV4.MatchlistDto = await api.matchV4.getMatchlist(Region.NA1, {
  path: [ summoner.accountId ],
  query: { champion: [ 17, 420 ] },
});
```
```typescript
let myResult: ReturnType<typeof api.championMasteryV4.getAllChampionMasteries>;
// myResult: Promise<championMasteryV4.ChampionMasteryDTO[]>
```


<!--
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
-->
