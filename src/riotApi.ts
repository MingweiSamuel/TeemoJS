// /** Spec, Endpoint, Method. */
// type SEM<TSpec extends EndpointsSpec, TEndpoint extends keyof TSpec, TMethod extends keyof TSpec[TEndpoint]> =
//     TSpec[TEndpoint][TMethod];

// /** Get path, query, or body param from SEM. */
// type GetParam<TSEM extends SEM<any, any, any>, TParamType extends 'path' | 'query' | 'body'> =
//     TSEM extends MethodSpec<any, infer TPathParams, infer TQueryParams, infer TBodyParam>
//         ? TParamType extends 'path'
//             ? {} extends TPathParams
//                 ? TPathParams | null
//             : TPathParams
//         : TParamType extends 'query'
//             ? {} extends TQueryParams
//                 ? TQueryParams | null
//             : TQueryParams
//         : TParamType extends 'body'
//             ? TBodyParam
//         : never
//     : never;

// /** Get method return type from SEM. */
// type MethodReturn<TSEM extends SEM<any, any, any>> =
//     TSEM extends MethodSpec<infer TReturn, any, any, any> ? Promise<TReturn> : Promise<any>;

// /** Get endpoint from SEM. */
// type Endpoint<TSEM extends SEM<any, any, any>> =
//     TSEM extends SEM<any, infer TEndpoint, any> ? TEndpoint : never;

// /** Get method from SEM. */
// type Method<TSEM extends SEM<any, any, any>> =
//     TSEM extends SEM<any, any, infer TMethod> ? TMethod : never;

// type NullableEmpty<T> = {} extends T ? T | null : T;

// type RiotApiReqOverloads<TSpec extends EndpointsSpec, TEndpoint extends keyof TSpec, TMethod extends keyof TSpec[TEndpoint]> =
//     (undefined extends GetParam<SEM<TSpec, TEndpoint, TMethod>, 'body'>
//         ? {} extends GetParam<SEM<TSpec, TEndpoint, TMethod>, 'query'>
//             ? {} extends GetParam<SEM<TSpec, TEndpoint, TMethod>, 'path'>
//                 // All optional.
//                 ? (
//                     endpoint: Endpoint<SEM<TSpec, TEndpoint, TMethod>>,
//                     method: Method<SEM<TSpec, TEndpoint, TMethod>>,
//                     region: Region | string,
//                     pathParams?: GetParam<SEM<TSpec, TEndpoint, TMethod>, 'path'> | null,
//                     queryParams?: GetParam<SEM<TSpec, TEndpoint, TMethod>, 'query'> | null,
//                     bodyParam?: GetParam<SEM<TSpec, TEndpoint, TMethod>, 'body'>,
//                 ) => MethodReturn<SEM<TSpec, TEndpoint, TMethod>>
//             // Body, query optional.
//             : (
//                 endpoint: Endpoint<SEM<TSpec, TEndpoint, TMethod>>,
//                 method: Method<SEM<TSpec, TEndpoint, TMethod>>,
//                 region: Region | string,
//                 pathParams: GetParam<SEM<TSpec, TEndpoint, TMethod>, 'path'>,
//                 queryParams?: GetParam<SEM<TSpec, TEndpoint, TMethod>, 'query'> | null,
//                 bodyParam?: GetParam<SEM<TSpec, TEndpoint, TMethod>, 'body'>,
//             ) => MethodReturn<SEM<TSpec, TEndpoint, TMethod>>
//         // Body optional.
//         : (
//             endpoint: Endpoint<SEM<TSpec, TEndpoint, TMethod>>,
//             method: Method<SEM<TSpec, TEndpoint, TMethod>>,
//             region: Region | string,
//             pathParams: GetParam<SEM<TSpec, TEndpoint, TMethod>, 'path'>,
//             queryParams: GetParam<SEM<TSpec, TEndpoint, TMethod>, 'query'>,
//             bodyParam?: GetParam<SEM<TSpec, TEndpoint, TMethod>, 'body'>,
//         ) => MethodReturn<SEM<TSpec, TEndpoint, TMethod>>
//     : never) |
//     // Nothing optional.
//     ((
//         endpoint: Endpoint<SEM<TSpec, TEndpoint, TMethod>>,
//         method: Method<SEM<TSpec, TEndpoint, TMethod>>,
//         region: Region | string,
//         pathParams: GetParam<SEM<TSpec, TEndpoint, TMethod>, 'path'>,
//         queryParams: GetParam<SEM<TSpec, TEndpoint, TMethod>, 'query'>,
//         bodyParam: GetParam<SEM<TSpec, TEndpoint, TMethod>, 'body'>,
//     ) => MethodReturn<SEM<TSpec, TEndpoint, TMethod>>);

// type RiotApiFluent<TSpec extends EndpointsSpec> = {
//     [TEndpoint in keyof TSpec]: {
//         [TMethod in keyof TSpec[TEndpoint]]:
//             TSpec[TEndpoint][TMethod] extends MethodSpec<infer TReturnType, infer TPathParams, infer TQueryParams, infer TBodyParam> ?
//                 undefined extends TBodyParam
//                     ? {} extends TQueryParams
//                         ? {} extends TPathParams
//                             // All optional.
//                             ? (
//                                 region: Region | string,
//                                 pathParams?: TPathParams | null,
//                                 queryParams?: TQueryParams | null,
//                                 bodyParam?: TBodyParam,
//                             ) => Promise<TReturnType>
//                         // Body, query optional.
//                         : (
//                             region: Region | string,
//                             pathParams: NullableEmpty<TPathParams>,
//                             queryParams?: TQueryParams | null,
//                             bodyParam?: TBodyParam,
//                         ) => Promise<TReturnType>
//                     // Body optional.
//                     : (
//                         region: Region | string,
//                         pathParams: NullableEmpty<TPathParams>,
//                         queryParams: NullableEmpty<TQueryParams>,
//                         bodyParam?: TBodyParam,
//                     ) => Promise<TReturnType>
//                 // Nothing optional.
//                 : (
//                     region: Region | string,
//                     pathParams: NullableEmpty<TPathParams>,
//                     queryParams: NullableEmpty<TQueryParams>,
//                     bodyParam: TBodyParam,
//                 ) => Promise<TReturnType>
//             : never;
//     };
// };

// type RiotApiReqOverloads<TSpec extends EndpointsSpec> = {
//     <TEndpoint extends keyof TSpec, TMethod extends keyof TSpec[TEndpoint]>(
//         endpoint: TEndpoint,
//         method: TMethod,
//         region: Region | string,
//         pathParams: NullableEmpty<TSpec[TEndpoint][TMethod] extends MethodSpec<any, infer TPathParams, any, any> ? TPathParams : never>,
//         queryParams: NullableEmpty<TSpec[TEndpoint][TMethod] extends MethodSpec<any, any, infer TQueryParams, any> ? TQueryParams : never>,
//         bodyParam: TSpec[TEndpoint][TMethod] extends MethodSpec<any, any, any, infer TBodyParam> ? TBodyParam : never,
//     ): TSpec[TEndpoint][TMethod] extends MethodSpec<infer TReturn, any, any, any> ? TReturn : never
// } & {
//     <TEndpoint extends keyof TSpec, TMethod extends keyof TSpec[TEndpoint]>(
//         endpoint: TEndpoint,
//         method: TMethod,
//         region: Region | string,
//         pathParams: NullableEmpty<TSpec[TEndpoint][TMethod] extends MethodSpec<any, infer TPathParams, any, any> ? TPathParams : never>,
//         queryParams: NullableEmpty<TSpec[TEndpoint][TMethod] extends MethodSpec<any, any, infer TQueryParams, any> ? TQueryParams : never>,
//         bodyParam?: TSpec[TEndpoint][TMethod] extends MethodSpec<any, any, any, infer TBodyParam> ? undefined extends TBodyParam ? never : TBodyParam : never,
//     ): TSpec[TEndpoint][TMethod] extends MethodSpec<infer TReturn, any, any, any> ? TReturn : never
// };

// type RiotApiReqOverloads<TSpec extends EndpointsSpec, TEndpoint extends keyof TSpec, TMethod extends keyof TSpec[TEndpoint]> = {
//     (
//         endpoint: TEndpoint,
//         method: TMethod,
//         region: Region | string,
//         pathParams: NullableEmpty<TSpec[TEndpoint][TMethod] extends MethodSpec<any, infer TPathParams, any, any> ? TPathParams : never>,
//         queryParams: NullableEmpty<TSpec[TEndpoint][TMethod] extends MethodSpec<any, any, infer TQueryParams, any> ? TQueryParams : never>,
//         bodyParam: TSpec[TEndpoint][TMethod] extends MethodSpec<any, any, any, infer TBodyParam> ? TBodyParam : never,
//     ): TSpec[TEndpoint][TMethod] extends MethodSpec<infer TReturn, any, any, any> ? TReturn : never
// }

type ReqReturn<TMethodSpec extends MethodSpec<any, any, any, any>> =
    TMethodSpec extends MethodSpec<infer TReturn, any, any, any>
        ? TReturn
    : never;

type ReqArgs<TMethodSpec extends MethodSpec<any, any, any, any>> =
    TMethodSpec extends MethodSpec<any, infer TPathParams, infer TQueryParams, infer TBodyParam>
        ? (
            ({} extends TPathParams
                ? { path?: TPathParams | null }
            : { path: TPathParams })
            &
            ({} extends TQueryParams
                ? { query?: TQueryParams | null }
            : { query: TQueryParams })
            &
            (undefined extends TBodyParam
                ? { body?: TBodyParam }
            : { body: TBodyParam })
        )
    : {
        path?: OrderedParams | null,
        query?: NamedParams | null,
        body?: any,
    };

type RiotApiFluent<TSpec extends EndpointsSpec> = {
    [TEndpoint in keyof TSpec]: {
        [TMethod in keyof TSpec[TEndpoint]]:
            {} extends ReqArgs<TSpec[TEndpoint][TMethod]>
                ? (region: Region | string, kwargs?: ReqArgs<TSpec[TEndpoint][TMethod]>) => never
            : (region: Region | string, kwargs?: ReqArgs<TSpec[TEndpoint][TMethod]>) => never;
    };
};

class RiotApi<TSpec extends EndpointsSpec> {
    readonly endpoints: TSpec;

    private readonly _config: Config;
    private readonly _regions: { [key: string]: { [region: string]: RegionalRequester } };

    static createRiotApi(): RiotApi<typeof SpecRiotApi> {
        return new RiotApi(SpecRiotApi, null as any);
    }

    constructor(endpoints: TSpec, config: Config) {
        this.endpoints = endpoints;

        this._config = config;
        this._regions = {};
    }

    toFluent(): RiotApiFluent<TSpec> {
        return new Proxy(this, getRiotApiProxyHandler()) as any;
    }

    req<TEndpoint extends keyof TSpec, TMethod extends keyof TSpec[TEndpoint]>
    (
        endpoint: TEndpoint,
        method: TMethod,
        region: Region | string,
        kwargs: ReqArgs<TSpec[TEndpoint][TMethod]>
    ): ReqReturn<TSpec[TEndpoint][TMethod]>
    {
        return null as any;
    }

    reqInternal(region: Region | string, methodId: string, urlStr: string, fetchConfig: import("node-fetch").RequestInit): any {
        return {};
    }

    private _getRegion(key: string, region: Region | string): RegionalRequester {
        const regionStr: string = ('string' === typeof region) ? region : Region[region];
        const keyRegions = this._regions[key] || (this._regions[key] = {});
        return keyRegions[regionStr] || (keyRegions[regionStr] = new RegionalRequester(this._config));
    }
}

/** @internal */
interface RiotApiEndpoint<TSpec extends EndpointsSpec, TEndpoint extends keyof TSpec> {
    base: RiotApi<TSpec>,
    endpoint: TEndpoint;
}

/** @internal */
function getRiotApiProxyHandler<TSpec extends EndpointsSpec>():
    ProxyHandler<RiotApi<TSpec>>
{
    return {
        get<TEndpoint extends keyof TSpec>(target: RiotApi<TSpec>, prop: TEndpoint | string | number | symbol, receiver: unknown): any {
            if ('string' === typeof prop && prop in target.endpoints) {
                const ep: RiotApiEndpoint<TSpec, TEndpoint> = { base: target, endpoint: prop as TEndpoint };
                return new Proxy(ep, getRiotApiEndpointProxyHandler<TSpec, TEndpoint>());
            }
            return Reflect.get(target, prop, receiver);
        },
        set: () => false,
    };
}
/** @internal */
function getRiotApiEndpointProxyHandler<TSpec extends EndpointsSpec, TEndpoint extends keyof TSpec>():
    ProxyHandler<RiotApiEndpoint<TSpec, TEndpoint>>
{
    return {
        get<TMethod extends keyof TSpec[TEndpoint]>(target: RiotApiEndpoint<TSpec, TEndpoint>, prop: TMethod | string | number | symbol, receiver: unknown) {
            if ('string' === typeof prop && prop in target.base.endpoints[target.endpoint]) {
                return (
                    region: Region | string,
                    kwargs: ReqArgs<TSpec[TEndpoint][TMethod]>,
                ): ReqReturn<TSpec[TEndpoint][TMethod]> =>
                    target.base.req(target.endpoint, prop as TMethod, region, kwargs);
            }
            return Reflect.get(target, prop, receiver);
        },
        set: () => false,
    };
}

exports.RiotApi = RiotApi;
