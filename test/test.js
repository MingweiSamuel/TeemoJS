const TeemoJS = require("../index");
const assert = require("assert");

const SID_LUGNUTSK = 'SBM8Ubipo4ge2yj7bhEzL7yvV0C9Oc1XA2l6v5okGMA_nCw';
const SID_C9SNEAKY = 'ghHSdADqgxKwcRl_vWndx6wKiyZx0xKQv-LOhOcU5LU';
const SID_TCTRE    = 'rF8-YEID3MSbgPF6Hsqdbq92FgdLjilZdhVgI7UARMbzzTk';
const AID_C9SNEAKY = 'ML_CcLT94UUHp1iDvXOXCidfmzzPrk_Jbub1f_INhw';

describe('TeemoJS', function() {
  let api;
  before(function() {
    let apiKey = process.env.RIOT_API_KEY;
    if (!apiKey)
      throw new Error('Must set RIOT_API_KEY in environment.');
    api = TeemoJS(apiKey, { maxConcurrent: 2 });
  });
  describe('#get()', function() {
    it('championMastery.getAllChampionMasteries', function() {
      return api.get('na1', 'championMastery.getAllChampionMasteries', SID_LUGNUTSK)
        .then(data => {
          assert.ok(data);
          assert.ok(data.length >= 48);
          assert.equal(data[0].championId, 143);
        });
    });
    it('championMastery.getChampionMastery', function() {
      return api.get('na1', 'championMastery.getChampionMastery', SID_LUGNUTSK, 143)
        .then(data => {
          assert.equal(data.championId, 143);
          assert.ok(data.championPoints >= 349767);
        });
    });

    it('match.getMatchlist', function() {
      return api.get('na1', 'match.getMatchlist', AID_C9SNEAKY, { champion: 429, season: 10 })
        .then(data => {
          //console.log(data);
          assert.ok(data);
          assert.ok(data.matches);
          assert.ok(data.matches.length > 10);
        });
    });
    it('match.getMatchlist (list params)', function() {
      return api.get('na1', 'match.getMatchlist', AID_C9SNEAKY, { champion: [81, 429], season: 8 })
        .then(data => {
          assert.ok(data);
          assert.ok(data.matches);
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
          assert.equal(data.id, SID_LUGNUTSK);
          assert.ok(data.summonerLevel > 30); // Level up.
        });
    });
    it('summoner.getBySummonerName encoding test', function() {
      return api.get('na1', 'summoner.getBySummonerName', 'The Øne And Ønly')
        .then(data => {
          assert.ok(data);
          assert.equal(data.id, 'hJqNbVEFncBg2KuHNUjztd6fJyy9ymX8LjYcGfrIuPXATow');
          assert.ok(data.summonerLevel >= 49);
          assert.equal(data.name, "The Øne And Ønly");
        });
    });
    // it('summoner.getBySummonerId many', function() {
    //   let ids = require('./ids.json');
    //   return Promise.all(ids.map(id =>
    //     api.get('na1', 'summoner.getBySummonerId', id)
    //       .then(data => {
    //         assert.ok(data);
    //         assert.equal(data.id, id);
    //       })
    //     ));
    // });

    // it('lolStaticData.getChampionList', function() {
    //   return api.get('na1', 'lolStaticData.getChampionList', { tags: 'all' })
    //     .then(data => {
    //       assert.ok(data);
    //     });
    // });

    it('league.getAllLeaguePositionsForSummoner', function() {
      return api.get('na1', 'league.getLeagueEntriesForSummoner', SID_TCTRE)
        .then(data => {
          let entry = data.find(e => e.queueType === 'RANKED_SOLO_5x5');
          console.log(entry.wins);
        });
    });
  });
});
