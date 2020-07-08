type RiotApiFluent<TSpec extends EndpointsSpec> = {
    [TEndpoint in keyof TSpec]: {
        [TMethod in keyof TSpec[TEndpoint]]:
            (
                region: ReqPlatforms<TSpec[TEndpoint][TMethod]>,
                ...kwargs: ReqArgsTuple<TSpec[TEndpoint][TMethod]>
            ) => ReqReturn<TSpec[TEndpoint][TMethod]>;
    };
};

class RiotApi<TSpec extends EndpointsSpec> {
    static readonly defaultApiKeyName: string = 'default';

    readonly config: Config<TSpec>;

    private readonly _requesters: { [rateLimitId: string]: RegionalRequester };

    static createRiotApi(apiKey: string): RiotApi<typeof RiotApiConfig.endpoints> {
        const config = {
            ...RiotApiConfig,
            apiKeys: {
                default: apiKey,
            },
        };
        return new RiotApi(config);
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
        region: ReqPlatforms<TSpec[TEndpoint][TMethod]>,
        ...[ kwargs, ..._ ]: ReqArgsTuple<TSpec[TEndpoint][TMethod]>
    ): ReqReturn<TSpec[TEndpoint][TMethod]>;
    req(
        endpoint: string | number,
        method: string | number,
        region: Region | string,
        ...[ kwargs, ..._ ]: ReqArgsTuple<any>
    ): ReqReturn<any>
    {
        kwargs = kwargs || {};

        // Get spec.
        let ep: { [method: string]: ReqSpec<any, any, any, any, any> };
        let sp: ReqSpec<any, any, any, any, any>;
        if ('object' !== typeof (ep = this.config.endpoints[endpoint]))
            throw Error(`Unknown endpoint "${endpoint}".\nAvailable endpoints: ${JSON.stringify(Object.keys(this.config.endpoints))}`);
        if ('string' !== typeof (sp = ep[method]).path)
            throw Error(`Unknown method "${method}" in endpoint "${endpoint}".\nAvailable methods: ${JSON.stringify(Object.keys(ep))}`);

        // Region string.
        const regionStr: string = 'number' === typeof region ? Region[region] : region;

        // Get API Key.
        const apiKeyName: string = sp.apiKeyName || RiotApi.defaultApiKeyName;
        const apiKey: string = this.config.apiKeys[apiKeyName] || this.config.apiKeys.default;
        if (!apiKey)
            throw Error(`No valid API key found for name "${apiKeyName}" or "default".`);

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
            'x-riot-token': apiKey,
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
module.exports.RiotApi = RiotApi;

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
            if ('string' === typeof prop && prop in target.config.endpoints)
                return new Proxy({ base: target, endpoint: prop } as RiotApiEndpoint<TSpec, TEndpoint>, getRiotApiEndpointProxyHandler<TSpec, TEndpoint>());
            return Reflect.get(target, prop, receiver);
        }
    };
}
/** @internal */
function getRiotApiEndpointProxyHandler<TSpec extends EndpointsSpec, TEndpoint extends keyof TSpec>():
    ProxyHandler<RiotApiEndpoint<TSpec, TEndpoint>>
{
    return {
        get<TMethod extends keyof TSpec[TEndpoint]>(target: RiotApiEndpoint<TSpec, TEndpoint>, prop: TMethod | string | number | symbol, receiver: unknown) {
            if ('string' === typeof prop && prop in target.base.config.endpoints[target.endpoint])
                return (
                    region: ReqPlatforms<TSpec[TEndpoint][TMethod]>,
                    ...kwargs: ReqArgsTuple<TSpec[TEndpoint][TMethod]>
                ): ReqReturn<TSpec[TEndpoint][TMethod]> =>
                    target.base.req(target.endpoint, prop as TMethod, region, ...kwargs);
            return Reflect.get(target, prop, receiver);
        }
    };
}
