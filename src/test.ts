function doStuffA(x: number): number {
    return x || 5;
}
function doStuffB(x?: number): number {
    return x || 5;
}

// doStuffA();

let a: Parameters<typeof doStuffA>;
let b: Parameters<typeof doStuffB>;


const w = RiotApi.createRiotApi();

// w.req("lolStatusV3", "getShardData", {}, {});
w.req("lolStatusV3", "getShardData", Region.NA1, {
});

// w.req("lolStatusV3", "getShardData", Region.NA1, null, null);

// // w.req("hello", "world", Region.NA1);
// w.req("lolStatusV3", "getShardData", Region.NA1, null, null, undefined);

w.req("matchV4", "getMatchlist", Region.NA1, {
    path: [ 'summonerId:alksj3iwjafls' ],
});

// // w.req("lolStatusV3", "getShardData", Region.NA1);
w.req("tournamentV4", "createTournamentCode", Region.NA1, {
    query: { 'tournamentId': 12314 },
    body: null as any,
});
w.req("tournamentV4", "createTournamentCode", Region.NA1, {
    query: { tournamentId: 123089 },
    body: {} as tournamentV4.TournamentCodeParameters,
});

const x = w.toFluent();

x.summonerV4.getBySummonerName(Region.NA1, { summonerName: 'LugnutsK' });
x.leagueV4.getMasterLeague(Region.EUROPE, { queue: "RANKED_FLEX_SR" });
x.lolStatusV3.getShardData(Region.NA1, {});

x.tournamentV4.registerProviderData(Region.NA1, null, null, {} as tournamentV4.ProviderRegistrationParameters);

// x.tournamentV4.createTournamentCode(Region.NA1, { tournamentId: 512512 });

x.tournamentV4.createTournamentCode(Region.NA1, {}, { tournamentId: 192830912 }, {} as tournamentV4.TournamentCodeParameters);

x.matchV4.getMatchlist(Region.NA1, { encryptedAccountId: 'askdjf' });
x.matchV4.getMatchlist(Region.NA1, { encryptedAccountId: 'askdjf' }, null);
x.matchV4.getMatchlist(Region.NA1, { encryptedAccountId: 'askdjf' }, { champion: [ 149 ] });

// x.req("lolStatusV3", "getShardData", Region.NA1, {});

// x.toFluent();
