# TeemoJS
[![](https://img.shields.io/npm/v/teemojs.svg)](https://www.npmjs.com/package/teemojs)

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

```node
const TeemoJS = require('teemojs');
let api = TeemoJS('RGAPI-KEY-HERE');

api.get('na1', 'summoner.getBySummonerName', 'LUG nutsk')
  .then(data => console.log(data.name + "'s summoner id is " + data.id + '.'));

// Get C9 Sneaky's games on Ezreal and Kalista for a particular season.
api.get('na1', 'match.getMatchlist', 78247, { champion: [81, 429], season: 8 })
  .then(...);
```

All requests are done via `.get(...)`.
- The first argument is the region.*
- The second is the `endpoint` path
(see [`defaultConfig.json`](https://github.com/MingweiSamuel/TeemoJS/blob/master/defaultConfig.json)).
- Then come any path arguments (usually zero or one, or two for `getChampionMastery`) which are for
summoner/match IDs, names, etc.
- Last is an optional object for any query parameters.

\*Note: this is optional if `config.prefix` isn't interpolated in custom or Champion.GG configurations.

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
- `timeout` [int]: Request timeout time in milliseconds (default 10,000).
- `distFator` [float 0..1]: Factor to multiply rate limits by. This can be changed at any time using the `api.setDistFactor(x)` method. For example, if your API key was distributed across two computers, you could set this to 0.5.
- `key` [OPTIONAL string]: Overrides the `key` argument passed into the constructor. Do not set unless you actually use this key.

Only modify the following properties if you know what you're doing. This is mainly documentation for future reference.

- `prefix` [interpolated string]: String containing the protocol and host without a trailing forward slash. May have one `%s` for the region or none if the API has no separate regions.
- `defaultBuckets` [object[]]: Array of configuration options for a rate limit's default buckets. These buckets remain in use until the actual rate limit is detected via headers. Each must have at least `timespan` (in milliseconds) and `limit`.
- `rateLimitTypeApplication` [object]: Rate limit type object for the application rate limit. Containing strings `name`, `headerLimit`, and `headerCount`. `name` is the name of the rate limit used for detecting which type caused a 429. `headerLimit` and `headerCount` are header names for the max rate limit and rate limit count respectively.
- `rateLimitTypeMethod` [object/null]: Same as `rateLimitTypeApplication` but for method rate limits. May be null if the API does not have per-method rate limits.
- `defaultRetryAfter` [string/null]: Default retry after in seconds if the `headerRetryAfter` is not provided in a 429. Use `null` to cause missing `headerRetryAfter` headers to throw an error.
- `headerRetryAfter` [string/null]: Header name to look for retry after time in seconds when a 429 is hit. If `null`, `defaultRetryAfter` should be set.
- `headerLimitType` [string]: Header name to match with the `name` of a rateLimitType to determine which rate limit hit a 429.
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
