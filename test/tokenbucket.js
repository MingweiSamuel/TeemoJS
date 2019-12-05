const { TokenBucket, delayPromise } = require("../index");
const assert = require("assert");

function testBurst(timespan, limit, count) {
  let bucket = new TokenBucket(timespan, limit);
  function makeReq() {
    let fn = () => {
      let delay = bucket.getDelay();
      if (delay >= 0)
        return delayPromise(delay).then(fn);
      bucket.getTokens(1);
      return Date.now();
    }
    return delayPromise(0).then(fn);
  }
  let startTime = Date.now();
  let promises = Array(count).fill().map(makeReq);
  return Promise.all(promises).then(timestamps => {
    timestamps.sort();
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

xdescribe('TokenBucket', function() {
  this.slow(2000);

  for (let i = 50; i < 200; i += 10) {
    let timespan = i * 2;
    let limit = i * 10 - 10;
    let count = Math.max(limit + 10, 200);
    it(`test burst ${count} into ${limit} per ${timespan}`,
      () => testBurst(timespan, limit, count));
  }
});
