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

    readonly config: Config<TSpec>;

    private readonly _requesters: { [rateLimitId: string]: RegionalRequester };

    static createRiotApi(apiKey: string): RiotApi<typeof spec.RiotApi> {
        return new RiotApi({
            endpoints: spec.RiotApi,
            apiKeys: {
                [apiKeyDefault]: apiKey
            },
            origin: "https://{}.api.riotgames.com",
        }); // TODO.
    }

    constructor(config: Config<TSpec>) {
        this.config = config;
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
        kwargs = kwargs || {};

        // Get spec.
        let ep: { [method: string]: spec.ReqSpec<any, any, any, any> };
        let sp: spec.ReqSpec<any, any, any, any>;
        if ('object' !== typeof (ep = this.config.endpoints[endpoint]))
            throw Error(`Unknown endpoint "${endpoint}".\nAvailable endpoints: ${JSON.stringify(Object.keys(this.config.endpoints))}`);
        if ('string' !== typeof (sp = ep[method]).path)
            throw Error(`Unknown method "${method}" in endpoint "${endpoint}".\nAvailable methods: ${JSON.stringify(Object.keys(ep))}`);

        // Region string.
        const regionStr: string = 'number' === typeof region ? Region[region] : region;

        // Get API Key.
        const apiKeyName: string = sp.apiKeyName || RiotApi.defaultApiKeyName;
        const apiKey: string = this.config.apiKeys[apiKeyName] || this.config.apiKeys[apiKeyDefault];
        if (!apiKey)
            throw Error(`No valid API key found for name "${apiKeyName}" or "${apiKeyDefault}".`);

        // Build URL.
        const path: string = kwargs.path ? format(sp.path, kwargs.path) : sp.path;

        // QueryParams. First build URL.
        const url = new URL(path, format(this.config.origin, [ regionStr ]));
        // Then build URL query params.
        kwargs.query && Object.entries(kwargs.query).forEach(([ key, vals ]) => {
            if (!Array.isArray(vals)) // Not array.
                url.searchParams.set(key, vals as string);
            // else if (this.config.collapseQueryArrays) // Array, collapse.
            //     url.searchParams.set(key, vals.join(','));
            else // Array, do not collapse.
                vals.forEach(val => url.searchParams.append(key, val));
        });

        // Build fetch.
        const headerInit: import("node-fetch").HeaderInit = {
            'X-Riot-Token': apiKey,
        };
        const fetchConfig: import("node-fetch").RequestInit = {
            method: sp.method,
            headers: headerInit,
        };
        if (kwargs.body) {
            fetchConfig.body = JSON.stringify(kwargs.body);
            headerInit['Content-Type'] = 'application/json';
        }

        // Build rateLimitId.
        const rateLimitId: string = `${regionStr}:${"TODO RATE LIMIT KEY"}`;
        // Build methodId.
        const methodId: string = `${endpoint}:${method}`;

        return this.reqInternal(rateLimitId, methodId, url.href, fetchConfig);
    }

    reqInternal(rateLimitId: string, methodId: string, url: string, fetchConfig: import("node-fetch").RequestInit): any {
        const requester: RegionalRequester =
            this._requesters[rateLimitId] || (this._requesters[rateLimitId] = new RegionalRequester(this.config));

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
            if ('string' === typeof prop && prop in target.config)
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
            if ('string' === typeof prop && prop in target.base.config.endpoints[target.endpoint])
                return (
                    region: Region | string,
                    ...kwargs: spec.ReqArgsTuple<TSpec[TEndpoint][TMethod]>
                ): spec.ReqReturn<TSpec[TEndpoint][TMethod]> =>
                    target.base.req(target.endpoint, prop as TMethod, region, ...kwargs);
            return Reflect.get(target, prop, receiver);
        }
    };
}
