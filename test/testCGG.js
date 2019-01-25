const TeemoJS = require("../index");
const assert = require("assert");

// disabled, c.gg down.
xdescribe('TeemoJS Champion.GG', function() {
  let api;
  before(function() {
    let apiKey = process.env.CGG_API_KEY;
    if (!apiKey)
      throw new Error('Must set CGG_API_KEY in environment.');
    api = TeemoJS(apiKey, TeemoJS.championGGConfig);
  });
  describe('#get()', function() {
    it('champion.getChampion', function() {
      return api.get('champion.getChampion', 143)
        .then(data => {
          assert.ok(data);
          assert.ok(data.length);
          assert.equal(data[0].championId, 143);
          assert.ok(0.2 < data[0].winRate && data[0].winRate < 0.8);
        });
    });
    it('champion.GetAllChampions with champData', function() {
      return api.get("champion.getAllChampions", { champData: [ "kda", "damage", "minions" ]})
        .then(data => {
          assert.ok(data);
          assert.ok(data.length);
          assert.ok(data[0].minionsKilled);
        });
    });
  });
});
