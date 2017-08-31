const TeemoJS = require("../index");
const assert = require("assert");

describe('TeemoJS', function() {
  let api;
  before(function() {
    let apiKey = process.env.RIOT_API_KEY;
    if (!apiKey)
      throw new Error('Must set RIOT_API_KEY in environment.');
    api = TeemoJS(apiKey, {})
  });
  describe('#get()', function() {
    it('championMastery.getAllChampionMasteries', function() {
      return api.get('na1', 'championMastery.getAllChampionMasteries', 69009277)
        .then(data => {
          assert.ok(data);
          assert.ok(data.length >= 48);
          assert.equal(data[0].championId, 143);
        });
    });

    it('match.getMatchlist', function() {
      return api.get('na1', 'match.getMatchlist', 78247, { champion: 429, season: 8 })
        .then(data => {
          //console.log(data);
          assert.ok(data);
          assert.ok(data.matches);
          assert.equal(data.matches.length, 3);
        });
    });
    it('match.getMatchlist (list params)', function() {
      return api.get('na1', 'match.getMatchlist', 78247, { champion: [81, 429], season: 8 })
        .then(data => {
          assert.ok(data);
          assert.ok(data.matches);
          assert.equal(data.matches.length, 11);
        });
    });
    it('match.getMatch', function() {
      return api.get('na1', 'match.getMatch', 2351868633)
        .then(data => {
          assert.ok(data);
          assert.equal(data.gameId, 2351868633);
          assert.equal(data.teams.length, 2);
          assert.equal(data.participants.length, 10);
        });
    });

    it('summoner.getBySummonerName', function() {
      return api.get('na1', 'summoner.getBySummonerName', 'Lugn uts k')
        .then(data => {
          assert.ok(data);
          assert.equal(data.id, 69009277);
          assert.equal(data.summonerLevel, 30);
        });
    });
    it('summoner.getBySummonerId many', function() {
      let ids = require('./ids.json');
      return Promise.all(ids.map(id =>
        api.get('na1', 'summoner.getBySummonerId', id)
          .then(data => {
            assert.ok(data);
            assert.equal(data.id, id);
          })
        ));
    });
  });
});
