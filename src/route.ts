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
    APAC  = 64,
    /** Brazil. */
    BR    = 65,
    /** Europe. */
    EU    = 66,
    /** Korea. */
    KR    = 67,
    /** Latin America. */
    LATAM = 68,
    /** North America. */
    NA    = 69,
}

/** Combined routing enum. */
const AnyRoute = { ...RegionalRoute, ...PlatformRoute, ...ValPlatformRoute };
/** Combined routing type. */
type AnyRoute = RegionalRoute | PlatformRoute | ValPlatformRoute;


namespace PlatformRoute {
    const PLATFORM_TO_REGIONAL = {
        [PlatformRoute.BR1]:  RegionalRoute.AMERICAS,
        [PlatformRoute.EUN1]: RegionalRoute.EUROPE,
        [PlatformRoute.EUW1]: RegionalRoute.EUROPE,
        [PlatformRoute.JP1]:  RegionalRoute.ASIA,
        [PlatformRoute.KR]:   RegionalRoute.ASIA,
        [PlatformRoute.LA1]:  RegionalRoute.AMERICAS,
        [PlatformRoute.LA2]:  RegionalRoute.AMERICAS,
        [PlatformRoute.NA1]:  RegionalRoute.AMERICAS,
        [PlatformRoute.OC1]:  RegionalRoute.AMERICAS,
        [PlatformRoute.TR1]:  RegionalRoute.EUROPE,
        [PlatformRoute.RU]:   RegionalRoute.EUROPE,
        [PlatformRoute.PBE1]: RegionalRoute.AMERICAS,
    };
    export function toRegional(route: PlatformRoute): Exclude<RegionalRoute, "SEA"> {
        return PLATFORM_TO_REGIONAL[route];
    }

    export function parse(str: string): PlatformRoute {
        switch (str.slice(0, 2).toUpperCase()) {
            case "BR": return PlatformRoute.BR1;
            case "JP": return PlatformRoute.JP1;
            case "KR": return PlatformRoute.KR;
            case "NA": return PlatformRoute.NA1;
            case "OC": return PlatformRoute.OC1;
            case "TR": return PlatformRoute.TR1;
            case "RU": return PlatformRoute.RU;
        }
        switch (str.slice(0, 3).toUpperCase()) {
            case "EUN": return PlatformRoute.EUN1;
            case "EUW": return PlatformRoute.EUN1;
            case "LAN":
            case "LA1": return PlatformRoute.LA1;
            case "LAS":
            case "LA2": return PlatformRoute.LA2;
        }
        throw new Error(`Failed to parse string as PlatformRoute: "${str}".`);
    }
}


Object.assign(module.exports, { RegionalRoute, PlatformRoute, ValPlatformRoute, AnyRoute });
