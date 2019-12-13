const parallel = require('mocha.parallel');
const assert = require("assert");

const TeemoJS = require("../src");

describe('TeemoJS LoL', function() {
  let api;

  before(function() {
    let apiKey = process.env.RIOT_API_KEY;
    if (!apiKey)
      throw new Error('Must set RIOT_API_KEY in environment.');
    api = TeemoJS(apiKey, { ...TeemoJS.defaultConfig, maxConcurrent: 10 });
  });

  parallel('bad args', function() {
    it('handles bad dist factor', function() {
      assert.throws(() => api.setDistFactor(0));
    });
    it ('handles bad region', function() {
      assert.throws(() => api.req('na1', 'lol.statusV3.getShardData')); // Should be 'na'.
    });
    it('handles missing path', function() {
      // TODO return promises?
      assert.throws(() => api.req('na', 'hello'));
      assert.throws(() => api.req('na', 'hello.world'));
    });
    it('handles missing path', function() {
      // TODO return promises?
      assert.throws(() => api.req('na', 'hello'));
      assert.throws(() => api.req('na', 'hello.world'));
      assert.throws(() => api.req('na', 'league'));
    });
    it('handles wrong path args', function() {
      // queue, tier, division.
      assert.throws(() => api.req('na', 'lol.leagueV4.getLeagueEntries', 'hi'));
      assert.throws(() => api.req('na', 'lol.leagueV4.getLeagueEntries', [ 'RANKED_SOLO_5x5', 'GOLD' ]));
      assert.throws(() => api.req('na', 'lol.leagueV4.getLeagueEntries', { tier: 'DIAMOND', division: '5' }));
    });
  });

  parallel('#req()', function() {
    this.slow(1500);
    it('championMastery.getAllChampionMasteries', async function() {
      const summoner = await api.req('na', 'lol.summonerV4.getBySummonerName', 'lugnutsk');
      const data = await api.req('na', 'lol.championMasteryV4.getAllChampionMasteries', { summonerId: summoner.id });
      assert.ok(data);
      assert.ok(data.length >= 48);
      assert.equal(data[0].championId, 143);
    });
    it('championMastery.getChampionMastery', async function() {
      const summoner = await api.req('na', 'lol.summonerV4.getBySummonerName', 'lugnutsk');
      const data = await api.req('na', 'lol.championMasteryV4.getChampionMastery', [ summoner.id, 143 ]);
      assert.equal(data.championId, 143);
      assert.ok(data.championPoints >= 500000);
    });

    it('match.getMatchlist', async function() {
      const summoner = await api.req('na', 'lol.summonerV4.getBySummonerName', 'c9 sneaky');
      const data = await api.req('na', 'lol.matchV4.getMatchlist', summoner.accountId, { champion: 429, queue: 420 });
      assert.ok(data);
      assert.ok(data.matches);
      assert.ok(data.matches.length > 10);
    });
    it('match.getMatchlist (list params)', async function() {
      const summoner = await api.req('na', 'lol.summonerV4.getBySummonerName', 'c9 sneaky');
      const data = await api.req('na', 'lol.matchV4.getMatchlist', [ summoner.accountId ], { champion: [81, 429], queue: 420 });
      assert.ok(data);
      assert.ok(data.matches);
    });
    it('match.getMatch', function() {
      return api.req('na', 'lol.matchV4.getMatch', 2351868633)
        .then(data => {
          assert.ok(data);
          assert.equal(data.gameId, 2351868633);
          assert.equal(data.teams.length, 2);
          assert.equal(data.participants.length, 10);
        });
    });

    it('summoner.getBySummonerName', async function() {
      const data = await api.req('na', 'lol.summonerV4.getBySummonerName', 'Lugn uts k');
      assert.ok(data);
      assert.ok(data.summonerLevel > 30); // Level up.
    });
    it('summoner.getBySummonerName encoding test', function() {
      return api.req('na', 'lol.summonerV4.getBySummonerName', { summonerName: 'The Øne And Ønly' })
        .then(data => {
          assert.ok(data);
          assert.equal(data.id, 'hJqNbVEFncBg2KuHNUjztd6fJyy9ymX8LjYcGfrIuPXATow');
          assert.ok(data.summonerLevel >= 49);
          assert.equal(data.name, "The Øne And Ønly");
        });
    });
    xit('summoner.getBySummonerName many', function() {
      // return api.req('eun1','league.getMasterLeague', 'RANKED_SOLO_5x5V4')
      //   .then(data => console.log(JSON.stringify(data.entries.map(s => s.summonerName), null, 2)));
      const names = require('./names.json');
      const count = 100;
      return Promise.all(names.slice(0, count).map(name =>
        api.req('eune', 'lol.summonerV4.getBySummonerName', name)
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
    //   return api.req('na', 'lolStaticDataV4.getChampionList', { tags: 'all' })
    //     .then(data => {
    //       assert.ok(data);
    //     });
    // });

    it('league.getAllLeaguePositionsForSummoner', async function() {
      const summoner = await api.req('na', 'lol.summonerV4.getBySummonerName', 'xBlotter');
      const data = await api.req('na', 'lol.leagueV4.getLeagueEntriesForSummoner', summoner.id);
      if (0 !== data.length) {
        let entry = data.find(e => e.queueType === 'RANKED_SOLO_5x5');
        assert.ok(entry.wins);
      }
    });
  });
  parallel('#req() tournament', function() {
    this.slow(500);
    it('works for tournament endpoints', async function() {
      const providerId = await api.req('na', 'tournament.stubV4.registerProviderData', {}, {}, {
        region: "NA",
        url: "https://github.com/MingweiSamuel/TeemoJS"
      });
      const tournamentId = await api.req('na', 'tournament.stubV4.registerTournament', {}, {}, {
        name: "teemo tournament :)",
        providerId
      });
      const codes = await api.req('na', 'tournament.stubV4.createTournamentCode', {},
        {
          count: 10,
          tournamentId
        },
        {
          //allowedSummonerIds: {},
          mapType: "SUMMONERS_RIFT",
          metadata: "eW91IGZvdW5kIHRoZSBzZWNyZXQgbWVzc2FnZQ==",
          pickType: "TOURNAMENT_DRAFT",
          spectatorType: "ALL",
          teamSize: 5
        });
      assert.ok(codes)
      assert.equal(codes.length, 10);
    });
  });
});
