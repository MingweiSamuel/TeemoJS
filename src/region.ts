enum Region {
    /** Platforms for LoL, LoR, TFT. */
    BR1  = 1,
    EUN1 = 2,
    EUW1 = 3,
    JP1  = 4,
    /** KR also works with Valorant. */
    KR   = 5,
    LA1  = 6,
    LA2  = 7,
    NA1  = 8,
    OC1  = 9,
    TR1  = 10,
    RU   = 11,
    /** PBE1 also works with Valorant. */
    PBE1 = 12,

    /** Valorant Platforms (besides PBE1 and KR). */
    APAC  = 16,
    BR    = 17,
    EU    = 18,
    LATAM = 19,
    NA    = 20,

    /** Routes */
    AMERICAS = 32,
    ASIA     = 33,
    EUROPE   = 34,
    SEA      = 35,
}

type ValorantPlatform = Region.APAC | Region.BR | Region.EU | Region.KR | Region.LATAM | Region.NA | Region.PBE1;

type RegionRoute = Region.AMERICAS | Region.EUROPE | Region.ASIA | Region.SEA;

namespace Region {
    // The AMERICAS routing value serves NA, BR, LAN, LAS, and OCE. The ASIA routing value serves KR and JP. The EUROPE routing value serves EUNE, EUW, TR, and RU.
    const ROUTES: RegionRoute[] = ((R: RegionRoute[]): RegionRoute[] => {
        // Platforms
        R[Region.BR1]  = Region.AMERICAS;
        R[Region.EUN1] = Region.EUROPE;
        R[Region.EUW1] = Region.EUROPE;
        R[Region.JP1]  = Region.ASIA;
        R[Region.KR]   = Region.ASIA;
        R[Region.LA1]  = Region.AMERICAS;
        R[Region.LA2]  = Region.AMERICAS;
        R[Region.NA1]  = Region.AMERICAS;
        R[Region.OC1]  = Region.AMERICAS;
        R[Region.TR1]  = Region.EUROPE;
        R[Region.RU]   = Region.EUROPE;
        // Routes
        R[Region.AMERICAS] = Region.AMERICAS;
        R[Region.EUROPE]   = Region.EUROPE;
        R[Region.ASIA]     = Region.ASIA;
        R[Region.SEA]      = Region.SEA;

        return R;
    })([]);
    export function getRoute(region: Region): RegionRoute {
        if (!ROUTES[region]) throw Error(`${Region[region]} (${region}) cannot be converted to route. (Is this a Valorant platform?)`);
        return ROUTES[region];
    }

    const ISVALORANTPLATFORM: { [K in ValorantPlatform]: true } = {
        [Region.APAC]:  true,
        [Region.BR]:    true,
        [Region.EU]:    true,
        [Region.KR]:    true,
        [Region.LATAM]: true,
        [Region.NA]:    true,
        [Region.PBE1]:  true,
    };
    export function isValorantPlatform(region: Region): region is ValorantPlatform {
        return region in ISVALORANTPLATFORM;
    }
}

module.exports.Region = Region;
