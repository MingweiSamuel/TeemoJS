# Version2

This document outlines changes made between TeemoJS 1.0 and 2.0.

See API Changes for possible changes you will need to make to upgrade.

## API Changes

* TeemoJS is now `MIT`-licensed (switched from `LGPL-3.0`).
* The `get` method has been renamed to `send`. `get` still exists as an alias for `send`, but is deprecated.
* Endpoint paths now include the version number (`V1`, `V3`, `V4`, etc).
  For example, `api.get('na1', 'match.getMatch', 3022273777)` is now `api.get('na1', 'matchV4.getMatch', 3022273777)`.


* On failed requests (when retries run out or the request is not retryable),
  an `Error` will always be thrown. Previously, some error codes (`403`, `401`,
  ?) would not result in `Error`s thrown.
* Thrown `Error`s may now contain a `.response` field containing the latest
  failed Fetch API `Response` instance.
* In the config, `"prefix"` has been renamed to `"origin"`.
* In the config, format strings now use `{}` or `{nameHere}` instead of `%s`.
  (Python `str.format`-style instead of sprintf-style `%s`).
* In the config, endpoints are now more than just a path. Now fetch params,
  query params, and other things can be defined in addition to `path`.

## Internal Changes

* Limiting concurrent requests (set via `config.maxConcurrent`) is more
  efficient.
* Requests delayed due to the max concurrent requests limit no longer count
  towards rate limits.
* Retry logic simplified using `async`/`await`.
