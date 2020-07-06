// interface EndpointConfig {
//     '*': void,
//     path?: string,
//     key?: string,
//     regionTable?: { [key: string]: string },
//     pathParams?:  { [key: string]: string },
//     queryParams?: { [key: string]: string },
//     bodyParam?: any,
//     fetch?: import("node-fetch").RequestInit,
// }

// interface EndpointsConfig {
//     '*'?: EndpointConfig,
//     [segment: string]: undefined | EndpointsConfig | EndpointConfig
// }

const apiKeyDefault = 'default';

interface Config<TSpec extends spec.EndpointsSpec> {
    apiKeys: {
        [K in typeof apiKeyDefault]: string
    } & {
        [K in string]: string | undefined
    },
    origin: string,
    // key?: string | undefined,
    // keyPath: string,
    // regionPath: string,
    // retries: number,
    // maxConcurrent: number,
    // distFactor: number,
    // defaultBuckets: InitialTokenBucketConfig[],
    // bucketsConfig: TokenBucketConfig,
    // rateLimitTypeApplication: RateLimitType,
    // rateLimitTypeMethod: RateLimitType,
    // defaultRetryAfter?: number,
    // headerRetryAfter: string,
    // headerLimitType?: string,
    // defaultLimitType: string,
    endpoints: TSpec,
}
