type GetParam<TSpec extends EndpointsSpec, TEndpoint extends keyof TSpec, TMethod extends keyof TSpec[TEndpoint], TParamType extends 'path' | 'query' | 'body'> =
    TSpec[TEndpoint][TMethod] extends MethodSpec<any, infer TPathParams, infer TQueryParams, infer TBodyParam>
        ? TParamType extends 'path'
            ? {} extends TPathParams
                ? TPathParams | null
            : TPathParams
        : TParamType extends 'query'
            ? {} extends TQueryParams
                ? TQueryParams | null
            : TQueryParams
        : TParamType extends 'body'
            ? TBodyParam
        : never
    : never;


// type SpecEndpointMethod<TSpec extends EndpointsSpec, TEndpoint extends keyof TSpec, TMethod extends keyof TSpec[TEndpoint]> =
//     TSpec[TEndpoint][TMethod];


type MethodReturn<TSpec extends EndpointsSpec, TEndpoint extends keyof TSpec, TMethod extends keyof TSpec[TEndpoint]> =
    TSpec[TEndpoint][TMethod] extends MethodSpec<infer TReturn, any, any, any> ? Promise<TReturn> : Promise<any>;

type RiotApiReqOverloads<TSpec extends EndpointsSpec, TEndpoint extends keyof TSpec, TMethod extends keyof TSpec[TEndpoint]> =
    (undefined extends GetParam<TSpec, TEndpoint, TMethod, 'body'>
        ? {} extends GetParam<TSpec, TEndpoint, TMethod, 'query'>
            ? {} extends GetParam<TSpec, TEndpoint, TMethod, 'path'>
                // All optional.
                ? (
                    endpoint: TEndpoint,
                    method: TMethod,
                    region: Region | string,
                    pathParams?: GetParam<TSpec, TEndpoint, TMethod, 'path'> | null,
                    queryParams?: GetParam<TSpec, TEndpoint, TMethod, 'query'> | null,
                    bodyParam?: GetParam<TSpec, TEndpoint, TMethod, 'body'>,
                ) => MethodReturn<TSpec, TEndpoint, TMethod>
            // Body, query optional.
            : (
                endpoint: TEndpoint,
                method: TMethod,
                region: Region | string,
                pathParams: GetParam<TSpec, TEndpoint, TMethod, 'path'>,
                queryParams?: GetParam<TSpec, TEndpoint, TMethod, 'query'> | null,
                bodyParam?: GetParam<TSpec, TEndpoint, TMethod, 'body'>,
            ) => MethodReturn<TSpec, TEndpoint, TMethod>
        // Body optional.
        : (
            endpoint: TEndpoint,
            method: TMethod,
            region: Region | string,
            pathParams: GetParam<TSpec, TEndpoint, TMethod, 'path'>,
            queryParams: GetParam<TSpec, TEndpoint, TMethod, 'query'>,
            bodyParam?: GetParam<TSpec, TEndpoint, TMethod, 'body'>,
        ) => MethodReturn<TSpec, TEndpoint, TMethod>
    : never) |
    // Nothing optional.
    ((
        endpoint: TEndpoint,
        method: TMethod,
        region: Region | string,
        pathParams: GetParam<TSpec, TEndpoint, TMethod, 'path'>,
        queryParams: GetParam<TSpec, TEndpoint, TMethod, 'query'>,
        bodyParam: GetParam<TSpec, TEndpoint, TMethod, 'body'>,
    ) => MethodReturn<TSpec, TEndpoint, TMethod>);

type RiotApiFluent<TSpec extends EndpointsSpec> = {
    [TEndpoint in keyof TSpec]: {
        [TMethod in keyof TSpec[TEndpoint]]:
            undefined extends GetParam<TSpec, TEndpoint, TMethod, 'body'>
                ? {} extends GetParam<TSpec, TEndpoint, TMethod, 'query'>
                    ? {} extends GetParam<TSpec, TEndpoint, TMethod, 'path'>
                        // All optional.
                        ? (
                            region: Region | string,
                            pathParams?: GetParam<TSpec, TEndpoint, TMethod, 'path'> | null,
                            queryParams?: GetParam<TSpec, TEndpoint, TMethod, 'query'> | null,
                            bodyParam?: GetParam<TSpec, TEndpoint, TMethod, 'body'>,
                        ) => MethodReturn<TSpec, TEndpoint, TMethod>
                    // Body, query optional.
                    : (
                        region: Region | string,
                        pathParams: GetParam<TSpec, TEndpoint, TMethod, 'path'>,
                        queryParams?: GetParam<TSpec, TEndpoint, TMethod, 'query'> | null,
                        bodyParam?: GetParam<TSpec, TEndpoint, TMethod, 'body'>,
                    ) => MethodReturn<TSpec, TEndpoint, TMethod>
                // Body optional.
                : (
                    region: Region | string,
                    pathParams: GetParam<TSpec, TEndpoint, TMethod, 'path'>,
                    queryParams: GetParam<TSpec, TEndpoint, TMethod, 'query'>,
                    bodyParam?: GetParam<TSpec, TEndpoint, TMethod, 'body'>,
                ) => MethodReturn<TSpec, TEndpoint, TMethod>
            // Nothing optional.
            : (
                region: Region | string,
                pathParams: GetParam<TSpec, TEndpoint, TMethod, 'path'>,
                queryParams: GetParam<TSpec, TEndpoint, TMethod, 'query'>,
                bodyParam: GetParam<TSpec, TEndpoint, TMethod, 'body'>,
            ) => MethodReturn<TSpec, TEndpoint, TMethod>
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

    req: RiotApiReqOverloads<TSpec, any, any> = (
        endpoint: string,
        method: string,
        region: Region | string,
        pathParams?: OrderedParams | null,
        queryParams?: NamedParams | null,
        bodyParam?: any,
    ): any => {
        // TODO
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
                    pathParams: GetParam<TSpec, TEndpoint, TMethod, 'path'>,
                    queryParams: GetParam<TSpec, TEndpoint, TMethod, 'query'>,
                    bodyParam: GetParam<TSpec, TEndpoint, TMethod, 'body'>,
                ): any => target.base.req(target.endpoint, prop as TMethod, region, pathParams, queryParams, bodyParam);
            }
            return Reflect.get(target, prop, receiver);
        },
        set: () => false,
    };
}

exports.RiotApi = RiotApi;
