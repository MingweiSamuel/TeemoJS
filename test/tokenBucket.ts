/// <reference path="../src/internal/tokenBucket.ts" />

import * as assert from "assert";
import { delayPromise } from "./testUtils";

const rewire: typeof import("rewire") = require("rewire");
const _TokenBucket = rewire("../dist/index").__get__<typeof TokenBucket>('TokenBucket');

function testBurst(timespan: number, limit: number, count: number): Promise<void> {
  let bucket = new _TokenBucket(timespan, limit);
  function makeReq() {
    let fn: () => Promise<number> | number = () => {
      let delay = bucket.getDelay();
      if (delay >= 0)
        return delayPromise(delay).then(fn);
      bucket.getTokens(1);
      return Date.now();
    }
    return delayPromise(0).then(fn);
  }
  //let startTime = Date.now();
  let promises = Array(count).fill(0).map(makeReq);
  return Promise.all(promises).then(timestamps => {
    timestamps.sort((a, b) => a - b);
    for (let i = 0, j = 1; i < timestamps.length; i++) {
      let maxTime = timestamps[i] + timespan;
      for (; j < timestamps.length; j++) {
        if (timestamps[j] > maxTime)
          break;
      }
      assert.ok(j - i <= limit, (j - i) + ':\n' + JSON.stringify(timestamps.slice(i, j + 1), null, 2));
    }
  });
}

describe('TokenBucket', function() {
  this.slow(2000);

  for (let i = 50; i < 200; i += 10) {
    let timespan = i * 2;
    let limit = i * 10 - 10;
    let count = Math.max(limit + 10, 200);
    it(`test burst ${count} into ${limit} per ${timespan}`,
      () => testBurst(timespan, limit, count));
  }
});
