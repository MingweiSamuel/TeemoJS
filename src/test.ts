const x = RiotApi.createRiotApi().toFluent();

x.summonerV4.getBySummonerName(Region.NA1, { summonerName: 'LugnutsK' });
x.leagueV4.getMasterLeague(Region.EUROPE, { queue: "RANKED_FLEX_SR" });
x.lolStatusV3.getShardData(Region.JP1);

// x.req("lolStatusV3", "getShardData", Region.NA1, {});

// x.toFluent();
