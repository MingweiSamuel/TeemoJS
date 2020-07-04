interface EndpointConfig {
    '*': void,
    path?: string,
    key?: string,
    regionTable?: { [key: string]: string },
    pathParams?:  { [key: string]: string },
    queryParams?: { [key: string]: string },
    bodyParam?: any,
    fetch?: import("node-fetch").RequestInit,
}

interface EndpointsConfig {
    '*'?: EndpointConfig,
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
    defaultBuckets: InitialTokenBucketConfig[],
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
