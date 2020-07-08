/** 32-bit integer (signed). */
type int = number;

/**
 * 64-bit integer (signed).
 * NOTE: Precision loss for numbers over Number.MAX_SAFE_INTEGER (~9 quadrilion).
 */
type long = number;

/** 32-bit single-precision float. */
type float = number;

/** 64-bit double-precision float. */
type double = number;

/** Header information for an application or method rate limit. */
interface RateLimitType {
    name: string,
    headerLimit: string,
    headerCount: string,
}

/** Token bucket configuration parameters. */
interface TokenBucketConfig {
    distFactor?: number,
    bins?: number,
    binFactor?: number,
    overhead?: number,
}

/** Default token bucket initialization parameters before rate limits are known. */
interface InitialTokenBucketConfig extends TokenBucketConfig {
    timespan: number,
    limit: number,
}

/** A configuration needed to instantiate a RiotApi. */
interface Config<TSpec extends EndpointsSpec> {
    apiKeys: {
        default: string,
        [apiKeyName: string]: string | undefined
    },
    origin: string,
    // key?: string | undefined,
    // keyPath: string,
    // regionPath: string,
    // retries: number,
    maxConcurrent: number,
    distFactor: number,
    defaultBuckets: InitialTokenBucketConfig[],
    bucketsConfig: TokenBucketConfig,
    rateLimitTypeApplication: RateLimitType,
    rateLimitTypeMethod: RateLimitType,
    // defaultRetryAfter?: number,
    headerRetryAfter: string,
    headerLimitType: string, // TODO optional?
    // defaultLimitType: string,
    endpoints: TSpec,
}

/** Listing of endpoints. */
type EndpointsSpec = {
    [endpoint: string]: {
        [method: string]: ReqSpec<any, any, any, any, any>
    }
};


/** Named query parameters. */
type NamedParams = { [argName: string]: unknown };
/** Ordered path parameters. */
type OrderedParams = { [argIdx: number]: unknown };

/** ReqSpec with optional type parameters for annotating the input parameters and return type. */
type ReqSpec<_TReturn, _TPlatforms extends string | Region, _TPath extends OrderedParams | NamedParams, _TQuery extends NamedParams, _TBody> = {
    path: string,
    method?: import("node-fetch").RequestInit['method'],
    apiKeyName?: string,
};

/** Utility type which extracts Promise<TReturn> from a ReqSpec. */
type ReqReturn<TReqSpec extends ReqSpec<any, any, any, any, any>> =
    TReqSpec extends ReqSpec<infer TReturn, any, any, any, any>
        ? Promise<TReturn>
    : never;

/** Utility type which extracts a Region type union from a ReqSpec. */
type ReqPlatforms<TReqSpec extends ReqSpec<any, any, any, any, any>> =
    TReqSpec extends ReqSpec<any, infer TPlatforms, any, any, any>
        ? TPlatforms extends keyof typeof Region
            ? (typeof Region)[TPlatforms]
        : TPlatforms
    : never;

/**
 * Utility type which creates a { path, query, body } kwargs type from a ReqSpec.
 * Fields are made optional if they are not required.
 */
type ReqArgs<TReqSpec extends ReqSpec<any, any, any, any, any>> =
    TReqSpec extends ReqSpec<any, any, infer TPath, infer TQuery, infer TBody>
        ? (
            ({} extends TPath
                ? { path?: TPath | null }
            : { path: TPath })
            &
            ({} extends TQuery
                ? { query?: TQuery | null }
            : { query: TQuery })
            &
            (undefined extends TBody
                ? { body?: TBody }
            : { body: TBody })
        )
    : {
        path?: OrderedParams | NamedParams | null,
        query?: NamedParams | null,
        body?: any,
    };

/**
 * ReqArgs but as a tuple so optional paramters can be spread.
 * HACK: see https://github.com/microsoft/TypeScript/issues/29131
 */
type ReqArgsTuple<TReqSpec extends ReqSpec<any, any, any, any, any>> =
    {} extends ReqArgs<TReqSpec> ? [ ReqArgs<TReqSpec>? ] : [ ReqArgs<TReqSpec> ];