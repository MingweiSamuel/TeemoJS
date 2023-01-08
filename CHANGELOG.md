# 3.0.0 (Prerelease)

## Non-API changes
* Teemo(J)S is now written in TypeScript and is fully-typed.
* Teemo(J)S is now `MIT`-licensed (switched from `LGPL-3.0`).

<!--
<table>
<tr><th>Before (1.x.x)</th><th>After (3.x.x)</th></tr>
<tr></tr>
<tr><td><pre lang="javascript">
summonerFuture = api.get(
  'na1', 'summoner.getBySummonerName',
  'xBlotter');
</pre></td>
<td><pre lang="javascript">
summonerFuture = api.req(
  'na', 'lol.summonerV4.getBySummonerName', 'xBlotter');
</pre></td></tr>
<tr></tr>
<tr><td><pre lang="javascript">
future = api.get(
  'euw1', 'league.getLeagueEntries',
  'RANKED_SOLO_5x5', 'GOLD', 'IV',
  { page: 12 });
</pre></td>
<td><pre lang="javascript">
future = api.req(
  'euw', 'lol.leagueV4.getLeagueEntries',
  [ 'RANKED_SOLO_5x5', 'GOLD', 'IV' ],
  { page: 12 });
</pre>Or, using an object for path params:
<pre lang="javascript">
future = api.req(
  'euw', 'lol.leagueV4.getLeagueEntries',
  { queue: 'RANKED_SOLO_5x5',
    tier: 'GOLD', division: 'IV' },
  { page: 12 });
</pre></td></tr>
</table>
-->

# 2.0.0 (prerelease)

2.0 was never released and skipped for version 3.0.

Changes made for TeemoJS 2.0.0

<table>
<tr><th>Before (1.3.4)</th><th>After (2.0.0)</th></tr>
<tr></tr>
<tr><td><pre lang="javascript">
summonerFuture = api.get(
  'na1', 'summoner.getBySummonerName',
  'xBlotter');
</pre></td>
<td><pre lang="javascript">
summonerFuture = api.req(
  'na', 'lol.summonerV4.getBySummonerName', 'xBlotter');
</pre></td></tr>
<tr></tr>
<tr><td><pre lang="javascript">
future = api.get(
  'euw1', 'league.getLeagueEntries',
  'RANKED_SOLO_5x5', 'GOLD', 'IV',
  { page: 12 });
</pre></td>
<td><pre lang="javascript">
future = api.req(
  'euw', 'lol.leagueV4.getLeagueEntries',
  [ 'RANKED_SOLO_5x5', 'GOLD', 'IV' ],
  { page: 12 });
</pre>Or, using an object for path params:
<pre lang="javascript">
future = api.req(
  'euw', 'lol.leagueV4.getLeagueEntries',
  { queue: 'RANKED_SOLO_5x5',
    tier: 'GOLD', division: 'IV' },
  { page: 12 });
</pre></td></tr>
</table>

<!--
## Main Changes
* `get` renamed to `req` (as `POST`, `PUT`, etc. endpoints now exist).
  * First param is a region (not a platform), automatically converted per `lol.*`, `tft.matchV1.*`, `tournament.*`.
    * Regions are: `"br", "eune", "euw", "jp", "kr", "lan", "las", "na", "oce", "tr", "ru", "pbe", "americas", "europe", "asia"`.
  * Second param (`endpointPath`) now includes `lol`, `tft`, or `tournament` as an additional prefix as well as the
    version (`V4`).
    * `summoner.getBySummonerName` (before) -> `lol.summonerV4.getBySummonerName` (after)
    * `tftLeague.getLeagueById` (before) -> `tft.leagueV1.getLeagueById` (after)
    * (no support for tournament before) -> `tournament.v4.updateCode` (after)
  * Path param(s) are now a single param, which may be a single value, list of values, or object map of values.
    * Before: `..., 'RANKED_SOLO_5x5', 'GOLD', 'IV', ...`
    * After (array):  `..., [ 'RANKED_SOLO_5x5', 'GOLD', 'IV' ], ...`
    * After (object): `..., { queue: 'RANKED_SOLO_5x5', tier: 'GOLD', division: 'IV' }, ...`
  * Query argument is unchanged (object map).
  * Additional body argument can be provided for `POST`, `PUT`, etc. requests. Value will be `JSON.stringify`d.
* `TeemoJS` is now browser-ready.
  * After `npm install`ing, `node_modules/teemojs/dist/browser.js` is a browserified version.
  * Usable with `ddragonConfig`, `cdragonConfig`, and `kernelConfig`
    ([meraki-analytics/kernel](https://github.com/meraki-analytics/kernel)). (`defaultConfig` will not work due to CORS).

### New Configs
* `TeemoJS.ddragonConfig` - Config for `https://ddragon.leagueoflegends.com` (drop-in).
* `TeemoJS.cdragonConfig` - Config for `https://[raw|cdn].communitydragon.org` (drop-in).
* `TeemoJS.kernelConfig` - Config for [meraki-analytics/kernel](https://github.com/meraki-analytics/kernel) (user must
  set `origin` field).

## Other API Changes
* TeemoJS is now `MIT`-licensed (switched from `LGPL-3.0`).
* The first argument to `req` is now a region rather than a platform. This will be automatically transformed to the
  right platform for different endpoints. For example, you should use `'na'` instead of `'na1'`. In `tftMatchV1`, it
  will automatically be translated into `'americas'`.
* Endpoint paths now include the version number (`V1`, `V3`, `V4`, etc).
  For example, `api.get('na1', 'match.getMatch', 3022273777)` is now `api.req('na', 'lol.matchV4.getMatch', 3022273777)`.
  (Note that `matchV4` has been replaced by `matchV5` with different arguments/routes).
* On failed requests (when retries run out or the request is not retryable),
  an `Error` will always be thrown. Previously, some error codes (`403`, `401`, ?) would not result in `Error`s thrown.
* Thrown `Error`s may now contain a `.response` field containing the latest failed Fetch API `Response` instance.

### Config Changes
* `"prefix"` renamed to `"origin"`.
* `"bucketsConfig"` added for fine tuning `TokenBucket`s.
  * `bins` (default: 20): Number of bins to compute circular buffer with.
  * `binFactor` (default: 0.95): Fraction of requests that can go in each bin. 0.95 means 95% of requests can be bursted
    in one bin (the remaining 5% can be used in the next bin).
  * `overhead` (default: 20ms): Time in milliseconds to expand the bucket by. Helps deal with latency causing requests
    to be counted in the wrong bucket.
* `"keyPath"` added to determine where to put key. `keyHeader` and `keyQueryParam` have been removed.
* `"regionPath"` added to determine where to put region string.
* Formatted strings now use `{}` or `{nameHere}` instead of `%s`.
  (Python `str.format`-style instead of sprintf-style `%s`).
* `endpoints` are now more than just a path. Now fetch params,
  query params, and other things can be defined in addition to `path`.
* `endpoints` can now contain `'*'` paths which will match all child endpoints. API `key`, `regionTable`, `pathParams`,
  `queryParams`, `fetch` params, `origin`, etc. can be overrided using these wildcard configs.

## Internal Changes

* Limiting concurrent requests (set via `config.maxConcurrent`) is more efficient, via new `Semaphore` class.
* Requests delayed due to the max concurrent requests limit no longer count towards rate limits.
* Retry logic simplified using `async`/`await`.
* Code is now ~400 lines instead of ~300, but much of that is comments, making the code more readable.
-->

# 1.3.4

* Adding TFT Endpoints to default config.

# 1.3.3

(not recorded, check the diffs)
