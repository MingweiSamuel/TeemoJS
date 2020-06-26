enum Region {
    // Platforms
    BR1  = 1,
    EUN1 = 2,
    EUW1 = 3,
    JP1  = 4,
    KR   = 5,
    LA1  = 6,
    LA2  = 7,
    NA1  = 8,
    OC1  = 9,
    TR1  = 10,
    RU   = 11,
    // Routes
    AMERICAS = 16,
    ASIA     = 17,
    EUROPE   = 18,
    SEA      = 19,
}

type RegionRoute = Region.AMERICAS | Region.EUROPE | Region.ASIA | Region.SEA;

namespace Region {
    // The AMERICAS routing value serves NA, BR, LAN, LAS, and OCE. The ASIA routing value serves KR and JP. The EUROPE routing value serves EUNE, EUW, TR, and RU.
    const ROUTES: Array<RegionRoute> = ((R: Array<RegionRoute>): Array<RegionRoute> => {
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
        return ROUTES[region];
    }
}

exports.Region = Region;
