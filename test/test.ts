import * as assert from "assert";

import { TeemoApi, RegionalRoute, PlatformRoute } from '../dist';

import { promisify } from "util";
import { readFile } from "fs";

describe('TeemoJS LoL', function() {
  let api: ReturnType<typeof TeemoApi.createRiotApi>;
  let apf: ReturnType<typeof api.proxy>;

  before(async function() {
    let apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) {
      try {
        apiKey = await promisify(readFile)('apikey.txt', "utf-8");
      }
      catch (e) {
        console.error(e);
        throw new Error('Must set RIOT_API_KEY envvar or have apikey.txt in repository root.');
      }
    }
    api = TeemoApi.createRiotApi(apiKey); // TODO: maxConcurrent: 50.
    apf = api.proxy();
  });

  describe('bad args', function() {
    it('handles bad dist factor', function() {
      assert.throws(() => api.setDistFactor(0));
      assert.throws(() => apf.base.setDistFactor(100));
    });
    it ('handles bad region', async function() {
      // Should be a region, not a platform.
      await assert.rejects(async () => api.req("lolStatusV3", "getShardData", RegionalRoute.AMERICAS as any));
      await assert.rejects(async () => apf.lolStatusV3.getShardData(RegionalRoute.AMERICAS as any));
    });
    it('handles missing path', async function() {
      await assert.rejects(async () => api.req("fakeEndpointV6" as any, "getFake", PlatformRoute.NA1) as Promise<unknown>);
      await assert.rejects(async () => (apf as any).fakeEndpointV6.getFake(PlatformRoute.NA1));

      await assert.rejects(async () => api.req("lolStatusV3", "getFake" as any, PlatformRoute.NA1) as Promise<unknown>);
      await assert.rejects(async () => (apf.lolStatusV3 as any).getFake(PlatformRoute.NA1));
    });
    it('handles wrong path args', async function() {
      // Should be: queue, tier, division.
      // Missing queue and tier.
      await assert.rejects(async () => apf.leagueV4.getLeagueEntries(PlatformRoute.NA1, { path: [ 'IV' ] as any }));
      // Wrong order.
      await assert.rejects(async () => api.req("leagueV4", "getLeagueEntries", PlatformRoute.NA1, { path: [ 'IV', 'GOLD', 'RANKED_SOLO_5x5' ] as any }));
      // Missing all three path args.
      await assert.rejects(async () => api.req("leagueV4", "getLeagueEntries", PlatformRoute.NA1, { query: { page: 10 } } as any));
    });
  });

  describe('#req()', function() {
    this.slow(1500);
    it('championMastery.getAllChampionMasteries', async function() {
      // TODO why isn't this null?
      const summoner = await apf.summonerV4.getBySummonerName(PlatformRoute.NA1, {
        path: [ 'lugnutsk' ],
      });
      const data = await apf.championMasteryV4.getAllChampionMasteries(PlatformRoute.NA1, {
        path: { encryptedSummonerId: summoner.id },
      });
      // const data = await api.req('na', 'lol.championMasteryV4.getAllChampionMasteries', { summonerId: summoner.id });
      assert.ok(data);
      assert.ok(data.length >= 48);
      assert.equal(data[0].championId, 143);
    });
    it('championMastery.getChampionMastery', async function() {
      // TODO why isn't this null?
      const summoner = await api.req("summonerV4", "getBySummonerName", PlatformRoute.NA1, {
        path: { summonerName: 'lugnutsk' },
      });
      const data = await api.req("championMasteryV4", "getChampionMastery", PlatformRoute.NA1, {
        path: [ summoner.id, 143 ],
      });
      assert.equal(data.championId, 143);
      assert.ok(data.championPoints >= 500000);
    });

    it('match.getMatchlist', async function() {
      // TODO why isn't this null?
      const summoner = await api.req("summonerV4", "getBySummonerName", PlatformRoute.NA1, {
        path: [ 'c9 zven' ],
      });
      const data = await apf.matchV4.getMatchlist(PlatformRoute.NA1, {
        path: { encryptedAccountId: summoner.accountId },
        query: { champion: 429, queue: 420 },
      });
      assert.ok(data);
      assert.ok(data.matches);
      assert.ok(data.matches.length > 10);
    });
    it('match.getMatchlist (list params)', async function() {
      // TODO why isn't this null?
      const summoner = await api.req("summonerV4", "getBySummonerName", PlatformRoute.NA1, {
        path: [ 'c9 zven' ],
      });
      const data = await apf.matchV4.getMatchlist(PlatformRoute.NA1, {
        path: [ summoner.accountId ],
        // TODO: optional lists.
        query: { champion: [ 81, 429 ], queue: [ 420 ] },
      });
      assert.ok(data);
      assert.ok(data.matches);
    });
    it('match.getMatch', async function() {
      const data = await apf.matchV4.getMatch(PlatformRoute.NA1, {
        path: [ 2351868633 ],
      });
      assert.ok(data);
      assert.equal(data.gameId, 2351868633);
      assert.equal(data.teams.length, 2);
      assert.equal(data.participants.length, 10);
    });

    it('summoner.getBySummonerName', async function() {
      const data = await apf.summonerV4.getBySummonerName(PlatformRoute.NA1, {
        path: [ 'Lugn uts k' ],
      });
      assert.ok(data);
      assert.ok(data.summonerLevel > 30); // Level up.
    });
    it('summoner.getBySummonerName encoding test', async function() {
      const summonerName = 'The Øne And Ønly';
      const data = await api.req("summonerV4", "getBySummonerName", PlatformRoute.NA1, {
        path: { summonerName },
      });
      assert.ok(data);
      // assert.equal(data.id, 'hJqNbVEFncBg2KuHNUjztd6fJyy9ymX8LjYcGfrIuPXATow');
      assert.ok(data.summonerLevel >= 49);
      assert.equal(data.name, summonerName);
    });
    xit('summoner.getBySummonerName many', function() {
      // TODO
      // // return api.req('eun1','league.getMasterLeague', 'RANKED_SOLO_5x5V4')
      // //   .then(data => console.log(JSON.stringify(data.entries.map(s => s.summonerName), null, 2)));
      // const names = require('./names.json');
      // const count = 150;
      // return Promise.all(names.slice(0, count).map(name =>
      //   api.req('eune', 'lol.summonerV4.getBySummonerName', name)
      //     .then(data => {
      //       if (null !== data) { // Null means name no longer exists.
      //         //assert.ok(data);
      //         //assert.equal(data.name, name); // TODO: handle case and space.
      //       }
      //       else {
      //         console.log(`Name not found: "${name}".`);
      //       }
      //     })
      //   ));
    });

    // it('lolStaticData.getChampionList', function() {
    //   return api.req('na', 'lolStaticDataV4.getChampionList', { tags: 'all' })
    //     .then(data => {
    //       assert.ok(data);
    //     });
    // });

    it('league.getAllLeaguePositionsForSummoner', async function() {
      const summoner = await apf.summonerV4.getBySummonerName(PlatformRoute.NA1, {
        path: [ 'xBlotter' ],
      });
      const data = await apf.leagueV4.getLeagueEntriesForSummoner(PlatformRoute.NA1, {
        path: [ summoner.id ],
      });
      if (0 !== data.length) {
        let entry = data.find(e => e.queueType === 'RANKED_SOLO_5x5');
        assert.ok(entry.wins);
      }
    });
  });
  it('#req() tournament', function() {
    this.slow(500);
    it('works for tournament endpoints', async function() {
      const providerId = await apf.tournamentStubV4.registerProviderData(RegionalRoute.AMERICAS, {
        body: {
          region: "NA",
          url: "https://github.com/MingweiSamuel/TeemoJS",
        },
      });
      const tournamentId = await apf.tournamentStubV4.registerTournament(RegionalRoute.AMERICAS, {
        body: {
          name: "Teemo Tournament :)",
          providerId,
        },
      });
      const codes = await apf.tournamentStubV4.createTournamentCode(RegionalRoute.AMERICAS, {
        query: {
          count: 10,
          tournamentId,
        },
        body: {
          //allowedSummonerIds: {},
          mapType: "SUMMONERS_RIFT",
          metadata: "eW91IGZvdW5kIHRoZSBzZWNyZXQgbWVzc2FnZQ==",
          pickType: "TOURNAMENT_DRAFT",
          spectatorType: "ALL",
          teamSize: 5,
        },
      });
      assert.ok(codes)
      assert.equal(codes.length, 10);
    });
  });
});
