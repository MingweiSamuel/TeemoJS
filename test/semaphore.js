//const parallel = require('mocha.parallel');
const assert = require("assert");

const { Semaphore, delayPromise } = require("../src");

describe('Semaphore', function() {
  this.slow(1000);
  it('works', function() {
    const max = 5;
    const sema = new Semaphore(max);
    let count = 0;
    let promises = Array(50).fill().map(async () => {
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
