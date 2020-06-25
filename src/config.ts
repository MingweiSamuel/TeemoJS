interface EndpointConfig {
    path?: string,
    regionTable?: { [key: string]: string },
    pathParams?:  { [key: string]: string },
    queryParams?: { [key: string]: string },
    fetch?: import("node-fetch").RequestInit,
}

interface EndpointsConfig {
    '*': undefined | EndpointConfig,
    [segment: string]: undefined | EndpointsConfig | EndpointConfig
}

interface Config {
    key?: string | undefined,
    keyPath: string,
    origin: string,
    regionPath: string,
    retries: number,
    maxConcurrent: number,
    distFactor: number,
    defaultBuckets: Array<InitialTokenBucketConfig>,
    bucketsConfig: TokenBucketConfig,
    rateLimitTypeApplication: RateLimitType,
    rateLimitTypeMethod: RateLimitType,
    defaultRetryAfter?: number,
    headerRetryAfter: string,
    headerLimitType?: string,
    defaultLimitType: string,
    collapseQueryArrays: boolean,
    endpoints: EndpointsConfig,
}
