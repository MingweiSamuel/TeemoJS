class RiotApi {
    private readonly config: Config;
    private readonly regions: { [methodId: string]: RegionalRequester }

    constructor(config: Config) {
        this.config = config;
        this.regions = {};
    }

    req(endpoint: string, method: string, region: Region, args?: object | Array<any>): any {
        return null;
    }

    reqInternal(region: Region | string, methodId: string, url: string, fetchConfig: import("node-fetch").RequestInit): any {
        const regionStr: string = ('string' === typeof region) ? region : Region[region];
        return null;
    }
}

exports.RiotApi = RiotApi;
