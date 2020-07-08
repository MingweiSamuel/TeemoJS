//// <reference path="../dist/index.d.ts" />

// import TeemoJS = require("../dist/index");
import { Region, RiotApi } from "../dist/index";
import type {tournamentStubV4, tournamentV4, summonerV4 } from "../dist/index";
// import * as TeemoJS from "../dist/index";
// TeemoJS.RiotApi.lorRankedV1.getLeaderboards.path
// const { Region, RiotApi, tournamentV4 } = TeemoJS;

let kjslkd: tournamentStubV4.LobbyEventDTO;
let aksjk: summonerV4.SummonerDTO;

const w = RiotApi.createRiotApi("myFakeApiKey");

// w.req("lolStatusV3", "getShardData", {}, {});
w.req("lolStatusV3", "getShardData", Region.NA1);
w.req("lolStatusV3", "getShardData", Region.NA1, {});

// w.req("lolStatusV3", "getShardData", Region.NA1, null, null);

// // w.req("hello", "world", Region.NA1);
// w.req("lolStatusV3", "getShardData", Region.NA1, null, null, undefined);

// let l: typeof w.req("matchV4", "getMatchlist", Region.NA1);
let l: typeof w.req;

// w.req("matchV4", "getMatchlist", Region.NA1);
w.req("matchV4", "getMatchlist", Region.NA1, {
    path: [ 'summonerId:alksj3iwjafls' ],
});

// // w.req("lolStatusV3", "getShardData", Region.NA1);
w.req("tournamentV4", "createTournamentCode", Region.AMERICAS, {
    query: { 'tournamentId': 12314 },
    body: null as any,
});
let xyz: tournamentV4.TournamentCodeParameters;

w.req("tournamentV4", "createTournamentCode", Region.AMERICAS, {
    query: { tournamentId: 123089 },
    body: {} as tournamentV4.TournamentCodeParameters,
});

const x = w.toFluent();

let a = x.lolStatusV3.getShardData(Region.NA1);
// x.summonerV4.getBySummonerName(Region.NA1);
x.lolStatusV3.getShardData(Region.NA1);

x.summonerV4.getBySummonerName(Region.NA1, {
    path: { summonerName: 'LugnutsK' }
});
x.leagueV4.getMasterLeague(Region.NA1, {
    path: [ "RANKED_SOLO_5x5" ]
});
x.lolStatusV3.getShardData(Region.NA1);

x.tournamentV4.registerProviderData(Region.AMERICAS, {
    body: {} as tournamentV4.ProviderRegistrationParameters
});

// x.tournamentV4.createTournamentCode(Region.NA1, { tournamentId: 512512 });

x.tournamentV4.createTournamentCode(Region.AMERICAS, {
    query: { tournamentId: 192830912 },
    body: {} as tournamentV4.TournamentCodeParameters
});

x.matchV4.getMatchlist(Region.NA1, {
    path: { encryptedAccountId: 'askdjf' },
});
x.matchV4.getMatchlist(Region.NA1, {
    path: [ 'askdjf' ],
});
x.matchV4.getMatchlist(Region.NA1, {
    path: { encryptedAccountId: 'askdjf' },
    query: { champion: [ 149 ] },
});

x.lorRankedV1.getLeaderboards(Region.getRoute(Region.NA1));

// x.req("lolStatusV3", "getShardData", Region.NA1, {});

// x.toFluent();
