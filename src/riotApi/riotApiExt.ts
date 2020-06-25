import { Region } from "../region";
import { Config } from "../config";

export declare class RiotApi {
    constructor(config: Config);
    req(endpoint: 'summonerV4', method: 'getById', region: Region, args?: object | Array<any>): string | null;
    req(endpoint: 'summonerV4', method: 'getByName', region: Region, args?: object | Array<any>): object | null;
}
