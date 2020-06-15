import { TokenBucketConfig } from "./tokenBucket";
import { RateLimitType } from "./rateLimit";

export interface EndpointConfig {
    path?: string,
    regionTable?: { [k: string]: string },
    fetch?: TODO,
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
    defaultBuckets: Array<TokenBucketConfig>,
    bucketsConfig: TokenBucketConfig,
    rateLimitTypeApplication: RateLimitType,
    rateLimitTypeMethod: RateLimitType,
    defaultRetryAfter?: number,
    headerRetryAfter: string,
    string: string,
    defaultLimitType: string,
    collapseQueryArrays: boolean,
    endpoints: EndpointsConfig,
}
