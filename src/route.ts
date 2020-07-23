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
    /** Rusia. */
    RU   = 25,
    /** Turkey. */
    TR1  = 26,

    /** Public Bet Environment. Only usable with `lolStatusV3`. */
    PBE1 = 31,
}

/** Valorant platform routing values. */
enum ValPlatformRoute {
    /** Asia Pacific. */
    AP    = 64,
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

/** RegionalRoute static utility functions. */
namespace RegionalRoute {
    /**
     * Parse a RegionalRoute from a string, or throw if unparsable.
     * Case-insensitive. Only looks at the beginning two-letter prefix to
     * determine the PlatformRoute.
     * @param str String to parse.
     * @param excludeSea (optional) if parsing SEA should result in an error.
     * @returns The parsed RegionalRoute.
     * @throws Error if `str` could not be parsed.
     */
    export function parse(str: string, excludeSea?: false): RegionalRoute;
    export function parse(str: string, excludeSea: true): Exclude<RegionalRoute, RegionalRoute.SEA>;
    export function parse(str: string, excludeSea = false): RegionalRoute {
        switch (str.slice(0, 2).toUpperCase()) {
            case "AM": return RegionalRoute.AMERICAS;
            case "AS": return RegionalRoute.ASIA;
            case "EU": return RegionalRoute.EUROPE;
            case "SE": if (!excludeSea) return RegionalRoute.SEA;
        }
        throw new Error(`Failed to parse string as RegionalRoute: "${str}" (exclude SEA: ${excludeSea}).`);
    }
}

/** PlatformRoute static utility functions. */
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
    } as const;
    /**
     * Converts a PlatformRoute to the corresponding RegionalRoute.
     * Useful for `tftMatchV1` endpoints which require a RegionalRoute, while
     * other TFT endpoints require a PlatformRoute.
     * @param route PlatformRoute to be converted.
     * @returns A RegionalRoute: `AMERICAS`, `ASIA`, or `EUROPE`. Will not
     * return `SEA`, which is only used by `lorRankedV1`.
     */
    export function toRegional(route: PlatformRoute): Exclude<RegionalRoute, RegionalRoute.SEA> {
        return PLATFORM_TO_REGIONAL[route];
    }

    /**
     * Parse a PlatformRoute from a string, or throw if unparsable.
     * Case-insensitive. Only looks at the beginning two or three-letter
     * prefix to determine the PlatformRoute.
     * @param str String to parse.
     * @returns The parsed PlatformRoute.
     * @throws Error if `str` could not be parsed.
     */
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

/** ValPlatformRoute static utility functions. */
namespace ValPlatformRoute {
    /**
     * Parse a ValPlatformRoute from a string, or throw if unparsable.
     * Case-insensitive. Only looks at the beginning two-letter prefix to
     * determine the PlatformRoute.
     * @param str String to parse.
     * @returns The parsed ValPlatformRoute.
     * @throws Error if `str` could not be parsed.
     */
    export function parse(str: string): ValPlatformRoute {
        switch (str.slice(0, 2).toUpperCase()) {
            case "AP": return ValPlatformRoute.AP;
            case "BR": return ValPlatformRoute.BR;
            case "EU": return ValPlatformRoute.EU;
            case "KR": return ValPlatformRoute.KR;
            case "LA": return ValPlatformRoute.LATAM;
            case "NA": return ValPlatformRoute.NA;
        }
        throw new Error(`Failed to parse string as ValPlatformRoute: "${str}".`);
    }
}


Object.assign(module.exports, { RegionalRoute, PlatformRoute, ValPlatformRoute, AnyRoute });
