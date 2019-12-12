const parallel = require('mocha.parallel');
const TeemoJS = require("../index");
const assert = require("assert");

// No API key access.
parallel('TeemoJS Meraki-Analytics Kernel', function() {
  this.slow(2000);

  // Make a deep copy to not modify the original (in case something else uses it).
  const config = JSON.parse(JSON.stringify(TeemoJS.kernelConfig));
  config.origin = "http://localhost:8080"
  config.maxConcurrent = 10;
  const api = TeemoJS(config);

  it('gets euw challenger league', async function() {
    const data = await api.req('euw', 'lol.leagueV4.getChallengerLeague', 'RANKED_SOLO_5x5')
    assert.ok(data);
    assert.ok(data.entries.length >= 10);
  });
  it('gets euw mithy', async function() {
    const data = await api.req('euw', 'lol.summonerV4.getBySummonerName', 'mithy');
    assert.ok(data);
    assert.ok(data.name);
  });
  it('gets na lugnutsk', async function() {
    const data = await api.req('na', 'lol.summonerV4.getBySummonerName', 'lugnu tsk');
    assert.ok(data);
    assert.ok(data.name);
  });
});
