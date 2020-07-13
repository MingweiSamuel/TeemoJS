/** 32-bit integer (signed). */
type int = number;

/**
 * 64-bit integer (signed).
 * NOTE: Precision loss for numbers over Number.MAX_SAFE_INTEGER (~9
 * quadrilion).
 */
type long = number;

/** 32-bit single-precision float. */
type float = number;

/** 64-bit double-precision float. */
type double = number;

/** Header information for an application or method rate limit. */
interface RateLimitType {
    readonly name: string,
    readonly headerLimit: string,
    readonly headerCount: string,
}

/** Token bucket configuration parameters. */
interface TokenBucketConfig {
    readonly distFactor?: number,
    readonly bins?: number,
    readonly binFactor?: number,
    readonly overhead?: number,
}

/**
 * Default token bucket initialization parameters before rate limits are known.
 */
interface InitialTokenBucketConfig extends TokenBucketConfig {
    readonly timespan: number,
    readonly limit: number,
}

/** Dictionary of API keys including a 'default' key. */
interface ApiKeys {
    default: string,
    [apiKeyName: string]: string | undefined,
}

/** A configuration needed to instantiate a RiotApi. */
interface Config<TSpec extends EndpointsSpec> {
    distFactor: number,
    readonly apiKeys: ApiKeys,
    readonly origin: string,
    // key?: string | undefined,
    // keyPath: string,
    // regionPath: string,
    // retries: number,
    readonly maxConcurrent: number,
    readonly defaultBuckets: InitialTokenBucketConfig[],
    readonly bucketsConfig: TokenBucketConfig,
    readonly rateLimitTypeApplication: RateLimitType,
    readonly rateLimitTypeMethod: RateLimitType,
    // defaultRetryAfter?: number,
    readonly headerRetryAfter: string,
    readonly headerLimitType: string, // TODO optional?
    // defaultLimitType: string,
    readonly endpoints: TSpec,
}

/** Listing of endpoints. */
type EndpointsSpec = {
    readonly [endpoint: string]: {
        readonly [method: string]: ReqSpec<any, any, any, any, any>
    }
};


/** Named query parameters. */
type NamedParams = { [argName: string]: unknown };
/** Ordered path parameters. */
type OrderedParams = { [argIdx: number]: unknown };

/**
 * ReqSpec with optional type parameters for annotating the input parameters
 * and return type.
 */
type ReqSpec<
    _TReturn,
    _TPlatforms extends AnyRoute,
    _TPath extends OrderedParams | NamedParams,
    _TQuery extends NamedParams, _TBody
> = {
    readonly path: string,
    readonly method?: import("node-fetch").RequestInit['method'],
    readonly apiKeyName?: string,
};

/** Utility type which extracts Promise<TReturn> from a ReqSpec. */
type ReqReturn<TReqSpec extends ReqSpec<any, any, any, any, any>> =
    TReqSpec extends ReqSpec<infer TReturn, any, any, any, any>
        ? Promise<TReturn>
    : Promise<unknown>;

/** Utility type which extracts a Region type union from a ReqSpec. */
type ReqRegion<TReqSpec extends ReqSpec<any, any, any, any, any>> =
    (TReqSpec extends ReqSpec<any, infer TPlatforms, any, any, any>
        ? TPlatforms
    : AnyRoute)
    | string;

/**
 * Utility type which allows top-level list fields to be replaced by single
 * non-list values of the corresponding type.
 */
type AllowSingleItemLists<T> = {
    [K in keyof T]: T[K] extends Array<infer TItem> ? T[K] | TItem : T[K]
};

/**
 * Utility type which creates a { path, query, body } kwargs type from a
 * ReqSpec. Fields are made optional if they are not required.
 */
type ReqArgs<TReqSpec extends ReqSpec<any, any, any, any, any>> =
    TReqSpec extends ReqSpec<any, any, infer TPath, infer TQuery, infer TBody>
        ? (
            ({} extends TPath
                ? { path?: TPath | null }
            : { path: TPath })
            &
            ({} extends TQuery
                ? { query?: AllowSingleItemLists<TQuery> | null }
            : { query: AllowSingleItemLists<TQuery> })
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
    {} extends ReqArgs<TReqSpec>
        ? [ ReqArgs<TReqSpec>? ]
    : [ ReqArgs<TReqSpec> ];