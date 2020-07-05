// class MyClass<T> {
//     public t: T = null as any;
// }

// let a: MyClass<string> & MyClass<undefined> = null as any;
// let b: MyClass<string & undefined>;
// let c = a.t;

// let a: { hello: 'world' } & undefined;
// let b: never = null as never;



// function doStuffA(x: number): number {
//     return x || 5;
// }
// function doStuffB(x?: number): number {
//     return x || 5;
// }

// doStuffA();

// let a: Parameters<typeof doStuffA>;
// let b: Parameters<typeof doStuffB>;


const w = RiotApi.createRiotApi();

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
w.req("tournamentV4", "createTournamentCode", Region.NA1, {
    query: { 'tournamentId': 12314 },
    body: null as any,
});
w.req("tournamentV4", "createTournamentCode", Region.NA1, {
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
x.leagueV4.getMasterLeague(Region.EUROPE, {
    path: [ "RANKED_SOLO_5x5" ]
});
x.lolStatusV3.getShardData(Region.NA1);

x.tournamentV4.registerProviderData(Region.NA1, {
    body: {} as tournamentV4.ProviderRegistrationParameters
});

// x.tournamentV4.createTournamentCode(Region.NA1, { tournamentId: 512512 });

x.tournamentV4.createTournamentCode(Region.NA1, {
    query: { tournamentId: 192830912 },
    body: {} as tournamentV4.TournamentCodeParameters
});

x.matchV4.getMatchlist(Region.NA1, {
    path: { encryptedAccountId: 'askdjf' }
});
x.matchV4.getMatchlist(Region.NA1, {
    path: [ 'askdjf' ]
});
x.matchV4.getMatchlist(Region.NA1, {
    path: { encryptedAccountId: 'askdjf' },
    query: { champion: [ 149 ] }
});

// x.req("lolStatusV3", "getShardData", Region.NA1, {});

// x.toFluent();
