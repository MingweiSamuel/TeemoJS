/// <reference path="../src/internal/semaphore.ts" />

import * as assert from "assert";
import { delayPromise } from "./testUtils";

const rewire: typeof import("rewire") = require("rewire");
const _Semaphore = rewire("../dist/index").__get__<typeof Semaphore>('Semaphore');

describe('Semaphore', function() {
  this.slow(1000);
  it('works', function() {
    const max = 5;
    const sema = new _Semaphore(max);
    let count = 0;
    const promises = Array(50).fill(0).map(async () => {
      await delayPromise(5 * Math.random());
      await sema.acquire();
      assert.ok(++count <= max);
      await delayPromise(100 * Math.random());
      assert.ok(count-- <= max);
      sema.release();
    });
    return Promise.all(promises);
  });
});
