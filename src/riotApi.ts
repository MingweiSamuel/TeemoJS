type RiotApiFluent<TSpec extends spec.EndpointsSpec> = {
    [TEndpoint in keyof TSpec]: {
        [TMethod in keyof TSpec[TEndpoint]]:
            (
                region: Region | string,
                ...kwargs: spec.ReqArgsTuple<TSpec[TEndpoint][TMethod]>
            ) => spec.ReqReturn<TSpec[TEndpoint][TMethod]>;
    };
};

class RiotApi<TSpec extends spec.EndpointsSpec> {
    static readonly defaultApiKeyName: string = 'default';
    // static readonly spec: typeof spec.RiotApi = spec.RiotApi;

    readonly endpoints: TSpec;

    private readonly _config: Config;
    private readonly _requesters: { [rateLimitId: string]: RegionalRequester };

    static createRiotApi(): RiotApi<typeof spec.RiotApi> {
        return new RiotApi(spec.RiotApi, null as any);
    }

    constructor(endpoints: TSpec, config: Config) {
        this.endpoints = endpoints;

        this._config = config;
        this._requesters = {};
    }

    toFluent(): RiotApiFluent<TSpec> {
        return new Proxy(this, getRiotApiProxyHandler()) as any;
    }

    req<TEndpoint extends keyof TSpec, TMethod extends keyof TSpec[TEndpoint]>(
        endpoint: TEndpoint,
        method: TMethod,
        region: Region | string,
        ...[ kwargs, ..._ ]: spec.ReqArgsTuple<TSpec[TEndpoint][TMethod]>
    ): spec.ReqReturn<TSpec[TEndpoint][TMethod]>;
    req(
        endpoint: string | number,
        method: string | number,
        region: Region | string,
        ...[ kwargs, ..._ ]: spec.ReqArgsTuple<any>
    ): spec.ReqReturn<any>
    {
        let ep: { [method: string]: spec.ReqSpec<any, any, any, any> };
        let sp: spec.ReqSpec<any, any, any, any>;
        if ('object' !== typeof (ep = this.endpoints[endpoint]))
            throw Error(`Unknown endpoint "${endpoint}".\nAvailable endpoints: ${JSON.stringify(Object.keys(this.endpoints))}`);
        if ('string' !== typeof (sp = ep[method]).path)
            throw Error(`Unknown method "${method}" in endpoint "${endpoint}".\nAvailable methods: ${JSON.stringify(Object.keys(ep))}`);

        // Get API Key.
        const _apiKey: string = sp.apiKeyName || RiotApi.defaultApiKeyName;

        // Build URL.
        const url: string = kwargs?.path ? format(sp.path, kwargs.path) : sp.path;

        // Build fetch.
        const fetchConfig: import("node-fetch").RequestInit = {};
        fetchConfig.method = sp.method;

        // Build rateLimitId.
        const regionStr: string = 'number' === typeof region ? Region[region] : region;
        const rateLimitId: string = `${regionStr}:${"TODO RATE LIMIT KEY"}`;
        // Build methodId.
        const methodId: string = `${endpoint}:${method}`;

        return this.reqInternal(rateLimitId, methodId, url, fetchConfig);
    }

    reqInternal(rateLimitId: string, methodId: string, url: string, fetchConfig: import("node-fetch").RequestInit): any {
        const requester: RegionalRequester =
            this._requesters[rateLimitId] || (this._requesters[rateLimitId] = new RegionalRequester(this._config));

        return requester.req(methodId, url, fetchConfig);
    }
}
exports.RiotApi = RiotApi;

/** @internal */
interface RiotApiEndpoint<TSpec extends spec.EndpointsSpec, TEndpoint extends keyof TSpec> {
    base: RiotApi<TSpec>,
    endpoint: TEndpoint;
}

/** @internal */
function getRiotApiProxyHandler<TSpec extends spec.EndpointsSpec>():
    ProxyHandler<RiotApi<TSpec>>
{
    return {
        get<TEndpoint extends keyof TSpec>(target: RiotApi<TSpec>, prop: TEndpoint | string | number | symbol, receiver: unknown): any {
            if ('string' === typeof prop && prop in target.endpoints)
                return new Proxy({ base: target, endpoint: prop } as RiotApiEndpoint<TSpec, TEndpoint>, getRiotApiEndpointProxyHandler<TSpec, TEndpoint>());
            return Reflect.get(target, prop, receiver);
        }
    };
}
/** @internal */
function getRiotApiEndpointProxyHandler<TSpec extends spec.EndpointsSpec, TEndpoint extends keyof TSpec>():
    ProxyHandler<RiotApiEndpoint<TSpec, TEndpoint>>
{
    return {
        get<TMethod extends keyof TSpec[TEndpoint]>(target: RiotApiEndpoint<TSpec, TEndpoint>, prop: TMethod | string | number | symbol, receiver: unknown) {
            if ('string' === typeof prop && prop in target.base.endpoints[target.endpoint])
                return (
                    region: Region | string,
                    ...kwargs: spec.ReqArgsTuple<TSpec[TEndpoint][TMethod]>
                ): spec.ReqReturn<TSpec[TEndpoint][TMethod]> =>
                    target.base.req(target.endpoint, prop as TMethod, region, ...kwargs);
            return Reflect.get(target, prop, receiver);
        }
    };
}
