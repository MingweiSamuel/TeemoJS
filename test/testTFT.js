const TeemoJS = require("../index");
const assert = require("assert");

// No API key access.
xdescribe('TeemoJS', function() {
  let api;
  before(function() {
    let apiKey = process.env.RIOT_API_KEY;
    if (!apiKey)
      throw new Error('Must set RIOT_API_KEY in environment.');
    api = TeemoJS(apiKey, { maxConcurrent: 2 });
  });
  describe('#get() TFT', function() {
    it('championMastery.getAllChampionMasteries', function() {
      return api.get('euw1', 'tftLeague.getChallengerLeague')
        .then(data => {
          console.log(data);
          assert.ok(data);
          assert.ok(data.entries.length >= 10); // Should be a lot more.
        });
    });
  });
});
