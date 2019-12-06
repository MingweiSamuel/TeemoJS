# Version2

This document outlines changes made between TeemoJS 1.0 and 2.0.

See API Changes for possible changes you will need to make to upgrade.

## API Changes

* In the config, `"prefix"` has been renamed to `"origin"`.
* On failed requests (when retries run out or the request is not retryable),
  an `Error` will always be thrown. Previously, some error codes (`403`, `401`,
  ?) would not result in `Error`s thrown.
* Thrown `Error`s may now contain a `.response` field containing the latest
  failed Fetch API `Response` instance.

## Internal Changes

* Limiting concurrent requests (set via `config.maxConcurrent`) is more
  efficient.
* Requests delayed due to the max concurrent requests limit no longer count
  towards rate limits.
* Retry logic simplified using `async`/`await`.
