/** Regional routing values for `tftMatchV1`, `lorRankedV1`, and `AMERICAS` for league endpoints. */
enum RegionalRoute {
    /** Americas. */
    AMERICAS = 1,
    /** Asia. */
    ASIA     = 2,
    /** Europe. */
    EUROPE   = 3,
    /** South East Asia. Only usable with the LoR endpoints (just `lorRankedV1` for now). */
    SEA      = 4,
}

/** Platform routing values for LoL, TFT. */
enum PlatformRoute {
    /** Brazil. */
    BR1  = 16,
    /** Europe, Northeast. */
    EUN1 = 17,
    /** Europe, West. */
    EUW1 = 18,
    /** Japan. */
    JP1  = 19,
    /** Korea. */
    KR   = 20,
    /** Latin America, North. */
    LA1  = 21,
    /** Latin America, South. */
    LA2  = 22,
    /** North America. */
    NA1  = 23,
    /** Oceana. */
    OC1  = 24,
    /** Turkey. */
    TR1  = 25,
    /** Rusia. */
    RU   = 26,
    /** Public Bet Environment. Only usable with `lolStatusV3`. */
    PBE1 = 27,
}

/** Valorant platform routing values. */
enum ValPlatformRoute {
    /** Asia Pacific. */
    APAC  = 32,
    /** Brazil. */
    BR    = 33,
    /** Europe. */
    EU    = 34,
    /** Korea. */
    KR    = 35,
    /** Latin America. */
    LATAM = 36,
    /** North America. */
    NA    = 37,
}

/** Combined routing enum. */
const AnyRoute = { ...RegionalRoute, ...PlatformRoute, ...ValPlatformRoute };
/** Combined routing type. */
type AnyRoute = RegionalRoute | PlatformRoute | ValPlatformRoute;

Object.assign(module.exports, { RegionalRoute, PlatformRoute, ValPlatformRoute, AnyRoute });
