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

  describe('bad args', function() {
    it('handles bad dist factor', function() {
      assert.throws(() => api.setDistFactor(0));
    });
    it('handles missing path', function() {
      // TODO return promises?
      assert.throws(() => api.get('hello'));
      assert.throws(() => api.get('hello.world'));
    });
    it('handles missing path', function() {
      // TODO return promises?
      assert.throws(() => api.get('hello'));
      assert.throws(() => api.get('hello.world'));
    });
    it('handles wrong path args', function() {
      // queue, tier, division.
      assert.throws(() => api.get('league.getLeagueEntries', 'hiV4'));
      assert.throws(() => api.get('league.getLeagueEntries', [ 'hello', 'world' ]));
      assert.throws(() => api.get('league.getLeagueEntries', { tier: 'DIAMOND', division: '5' }));
    });
  });

  describe('#get()', function() {
    this.slow(500);
    it('championMastery.getAllChampionMasteries', function() {
      return api.get('na1', 'championMasteryV4.getAllChampionMasteries', { summonerId: SID_LUGNUTSK })
        .then(data => {
          assert.ok(data);
          assert.ok(data.length >= 48);
          assert.equal(data[0].championId, 143);
        });
    });
    it('championMastery.getChampionMastery', function() {
      return api.get('na1', 'championMasteryV4.getChampionMastery', [ SID_LUGNUTSK, 143 ])
        .then(data => {
          assert.equal(data.championId, 143);
          assert.ok(data.championPoints >= 349767);
        });
    });

    it('match.getMatchlist', function() {
      return api.get('na1', 'matchV4.getMatchlist', AID_C9SNEAKY, { champion: 429, season: 10 })
        .then(data => {
          //console.log(data);
          assert.ok(data);
          assert.ok(data.matches);
          assert.ok(data.matches.length > 10);
        });
    });
    it('match.getMatchlist (list params)', function() {
      return api.get('na1', 'matchV4.getMatchlist', [ AID_C9SNEAKY ], { champion: [81, 429], season: 8 })
        .then(data => {
          assert.ok(data);
          assert.ok(data.matches);
        });
    });
    it('match.getMatch', function() {
      return api.get('na1', 'matchV4.getMatch', 2351868633)
        .then(data => {
          assert.ok(data);
          assert.equal(data.gameId, 2351868633);
          assert.equal(data.teams.length, 2);
          assert.equal(data.participants.length, 10);
        });
    });

    it('summoner.getBySummonerName', function() {
      return api.get('na1', 'summonerV4.getBySummonerName', 'Lugn uts k')
        .then(data => {
          assert.ok(data);
          assert.equal(data.id, SID_LUGNUTSK);
          assert.ok(data.summonerLevel > 30); // Level up.
        });
    });
    it('summoner.getBySummonerName encoding test', function() {
      return api.get('na1', 'summonerV4.getBySummonerName', { summonerName: 'The Øne And Ønly' })
        .then(data => {
          assert.ok(data);
          assert.equal(data.id, 'hJqNbVEFncBg2KuHNUjztd6fJyy9ymX8LjYcGfrIuPXATow');
          assert.ok(data.summonerLevel >= 49);
          assert.equal(data.name, "The Øne And Ønly");
        });
    });
    xit('summoner.getBySummonerName many', function() {
      // return api.get('eun1','league.getMasterLeague', 'RANKED_SOLO_5x5V4')
      //   .then(data => console.log(JSON.stringify(data.entries.map(s => s.summonerName), null, 2)));
      const names = require('./names.json');
      const count = 100;
      return Promise.all(names.slice(0, count).map(name =>
        api.get('eun1', 'summonerV4.getBySummonerName', name)
          .then(data => {
            if (null !== data) { // Null means name no longer exists.
              //assert.ok(data);
              //assert.equal(data.name, name); // TODO: handle case and space.
            }
            else {
              console.log(`Name not found: "${name}".`);
            }
          })
        ));
    });

    // it('lolStaticData.getChampionList', function() {
    //   return api.get('na1', 'lolStaticDataV4.getChampionList', { tags: 'all' })
    //     .then(data => {
    //       assert.ok(data);
    //     });
    // });

    it('league.getAllLeaguePositionsForSummoner', function() {
      return api.get('na1', 'leagueV4.getLeagueEntriesForSummoner', SID_TCTRE)
        .then(data => {
          let entry = data.find(e => e.queueType === 'RANKED_SOLO_5x5');
          assert.ok(entry.wins);
        });
    });
  });
});
