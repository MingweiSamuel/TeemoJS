"use strict";
//// <reference path="../dist/index.d.ts" />
exports.__esModule = true;
// import TeemoJS = require("../dist/index");
var index_1 = require("../dist/index");
// TeemoJS.RiotApi.lorRankedV1.getLeaderboards.path
// const { Region, RiotApi } = TeemoJS;
var w = index_1.RiotApi.createRiotApi("myFakeApiKey");
// w.req("lolStatusV3", "getShardData", {}, {});
w.req("lolStatusV3", "getShardData", index_1.Region.NA1);
w.req("lolStatusV3", "getShardData", index_1.Region.NA1, {});
// w.req("lolStatusV3", "getShardData", Region.NA1, null, null);
// // w.req("hello", "world", Region.NA1);
// w.req("lolStatusV3", "getShardData", Region.NA1, null, null, undefined);
// let l: typeof w.req("matchV4", "getMatchlist", Region.NA1);
var l;
// w.req("matchV4", "getMatchlist", Region.NA1);
w.req("matchV4", "getMatchlist", index_1.Region.NA1, {
    path: ['summonerId:alksj3iwjafls']
});
// // w.req("lolStatusV3", "getShardData", Region.NA1);
w.req("tournamentV4", "createTournamentCode", index_1.Region.AMERICAS, {
    query: { 'tournamentId': 12314 },
    body: null
});
var xyz;
w.req("tournamentV4", "createTournamentCode", index_1.Region.AMERICAS, {
    query: { tournamentId: 123089 },
    body: {}
});
var x = w.toFluent();
var a = x.lolStatusV3.getShardData(index_1.Region.NA1);
// x.summonerV4.getBySummonerName(Region.NA1);
x.lolStatusV3.getShardData(index_1.Region.NA1);
x.summonerV4.getBySummonerName(index_1.Region.NA1, {
    path: { summonerName: 'LugnutsK' }
});
x.leagueV4.getMasterLeague(index_1.Region.NA1, {
    path: ["RANKED_SOLO_5x5"]
});
x.lolStatusV3.getShardData(index_1.Region.NA1);
x.tournamentV4.registerProviderData(index_1.Region.AMERICAS, {
    body: {}
});
// x.tournamentV4.createTournamentCode(Region.NA1, { tournamentId: 512512 });
x.tournamentV4.createTournamentCode(index_1.Region.AMERICAS, {
    query: { tournamentId: 192830912 },
    body: {}
});
x.matchV4.getMatchlist(index_1.Region.NA1, {
    path: { encryptedAccountId: 'askdjf' }
});
x.matchV4.getMatchlist(index_1.Region.NA1, {
    path: ['askdjf']
});
x.matchV4.getMatchlist(index_1.Region.NA1, {
    path: { encryptedAccountId: 'askdjf' },
    query: { champion: [149] }
});
x.lorRankedV1.getLeaderboards(index_1.Region.getRoute(index_1.Region.NA1));
// x.req("lolStatusV3", "getShardData", Region.NA1, {});
// x.toFluent();
