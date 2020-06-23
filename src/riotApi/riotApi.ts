import { Config } from "../config";
import { RegionalRequester } from "../regionalRequester";
import { RequestInit } from "node-fetch";
import { Region } from "../region";
import { RiotApiExt } from "./riotApiExt";

class RiotApiImpl {
    private readonly config: Config;
    private readonly regions: { [methodId: string]: RegionalRequester }

    constructor(config: Config) {
        this.config = config;
        this.regions = {};
    }

    req(endpoint: string, method: string, region: Region, args?: object | Array<any>): any {
        return null;
    }

    reqInternal(region: Region | string, methodId: string, url: string, fetchConfig: RequestInit): any {
        const regionStr: string = ('string' === typeof region) ? region : Region[region];
        return null;
    }
}

type RiotApi = RiotApiImpl;
declare type RiotApi = typeof RiotApiExt;
