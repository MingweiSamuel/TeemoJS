import { RequestInit } from "node-fetch";
import { TokenBucketConfig, TokenBucketDefaultConfig } from "./tokenBucketConfig";
import { RateLimitType } from "./rateLimitType";

export interface EndpointConfig {
    path?: string,
    regionTable?: { [k: string]: string },
    fetch?: RequestInit,
}

export interface EndpointsConfig {
    '*': EndpointConfig,
    [segment: string]: EndpointsConfig | EndpointConfig
}

export interface Config {
    key?: string | undefined,
    keyPath: string,
    origin: string,
    regionPath: string,
    retries: number,
    maxConcurrent: number,
    distFactor: number,
    defaultBuckets: Array<TokenBucketDefaultConfig>,
    bucketsConfig: TokenBucketConfig,
    rateLimitTypeApplication: RateLimitType,
    rateLimitTypeMethod: RateLimitType,
    defaultRetryAfter?: number,
    headerRetryAfter: string,
    string: string,
    headerLimitType?: string,
    defaultLimitType: string,
    collapseQueryArrays: boolean,
    endpoints: EndpointsConfig,
}
