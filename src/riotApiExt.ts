interface RiotApi {
    req(endpoint: "summonerV4", method: "getByName", region: Region, args?: object | Array<any>): { [key: string]: string };
}
