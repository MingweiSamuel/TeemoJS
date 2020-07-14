type ErrorWithResponse = Error & { response?: import("node-fetch").Response };

type TeemoApiProxy<TSpec extends EndpointsSpec> = {
    [TEndpoint in Exclude<keyof TSpec, "base">]: {
        [TMethod in keyof TSpec[TEndpoint]]:
            (
                region: ReqRoutes<TSpec[TEndpoint][TMethod]>,
                ...kwargs: ReqArgsTuple<TSpec[TEndpoint][TMethod]>
            ) => ReqReturn<TSpec[TEndpoint][TMethod]>;
    }
} & {
    base: TeemoApi<TSpec>,
};

class TeemoApi<TSpec extends EndpointsSpec> {
    /** The config for this TeemoApi. */
    readonly config: Config<TSpec>;

    /** The requesters created by this TeemoApi, keyed uniquely per api key and region. */
    private readonly _requesters: { [rateLimitId: string]: RegionalRequester };

    static createRiotApi(apiKey: string | RiotApiKeys, distFactor = 1.0): TeemoApi<typeof RiotApiConfig.endpoints> {
        const apiKeys: ApiKeys = 'string' === typeof apiKey ? { default: apiKey } : apiKey;
        if (!apiKeys.default) throw Error('apiKey argument to createRiotApi missing "default" key.');
        if (distFactor <= 0 || 1 < distFactor) throw Error(`Invalid distFactor: ${distFactor}, must be in range (0, 1].`);
        return new TeemoApi({
            ...RiotApiConfig,
            distFactor,
            apiKeys
        });
    }

    constructor(config: Config<TSpec>) {
        this.config = config;
        this._requesters = {};
    }

    proxy(): TeemoApiProxy<TSpec> {
        return new Proxy(this, getApiProxyHandler()) as unknown as TeemoApiProxy<TSpec>;
    }

    req<TEndpoint extends keyof TSpec, TMethod extends keyof TSpec[TEndpoint]>(
        endpoint: TEndpoint,
        method: TMethod,
        region: ReqRoutes<TSpec[TEndpoint][TMethod]>,
        ...[ kwargs, ..._ ]: ReqArgsTuple<TSpec[TEndpoint][TMethod]>
    ): ReqReturn<TSpec[TEndpoint][TMethod]>;
    req(
        endpoint: string | number,
        method: string | number,
        region: AnyRoute | string,
        ...[ kwargs, ..._ ]: ReqArgsTuple<ReqSpec>
    ): ReqReturn
    {
        kwargs = kwargs || {};

        // Get spec.
        let ep: { [method: string]: ReqSpec };
        let sp: ReqSpec;
        if ('object' !== typeof (ep = this.config.endpoints[endpoint]))
            throw Error(`Unknown endpoint "${endpoint}".\nAvailable endpoints: ${JSON.stringify(Object.keys(this.config.endpoints))}`);
        if ('string' !== typeof (sp = ep[method]).path)
            throw Error(`Unknown method "${method}" in endpoint "${endpoint}".\nAvailable methods: ${JSON.stringify(Object.keys(ep))}`);

        // Region string.
        const regionStr: string = 'number' === typeof region ? AnyRoute[region] : region;

        // Get API Key.
        const apiKey: string = sp.apiKeyName && this.config.apiKeys[sp.apiKeyName] || this.config.apiKeys.default;
        if (!apiKey) throw Error(`No valid API key found for name ${JSON.stringify(sp.apiKeyName)} or "default".`);

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
        const rateLimitId = `${strHash(apiKey)}:${regionStr}`;
        // Build methodId.
        const methodId = `${endpoint}:${method}`;

        return this.reqInternal(rateLimitId, methodId, url.href, fetchConfig) as ReqReturn;
    }

    reqInternal(rateLimitId: string, methodId: string, url: string, fetchConfig: import("node-fetch").RequestInit): unknown {
        const requester: RegionalRequester =
            this._requesters[rateLimitId] || (this._requesters[rateLimitId] = new RegionalRequester(this.config));

        return requester.req(methodId, url, fetchConfig);
    }

    setDistFactor(factor: number): void {
        if (factor <= 0 || 1 < factor) throw new Error("Factor must be greater than zero and non-greater than one.");
        if (this.config.distFactor === factor) return;
        this.config.distFactor = factor;
        Object.values(this._requesters).forEach(r => r.updateDistFactor());
    }
}
(module.exports as { TeemoApi: typeof TeemoApi }).TeemoApi = TeemoApi;

/** @internal */
interface TeemoApiEndpoint<TSpec extends EndpointsSpec, TEndpoint extends keyof TSpec> {
    base: TeemoApi<TSpec>,
    endpoint: TEndpoint;
}

/** @internal */
function getApiProxyHandler<TSpec extends EndpointsSpec>():
    ProxyHandler<TeemoApi<TSpec>>
{
    return {
        get<TEndpoint extends keyof TSpec>(target: TeemoApi<TSpec>, prop: TEndpoint | string | number | symbol, _receiver: unknown) {
            if (prop in target.config.endpoints)
                return new Proxy({ base: target, endpoint: prop as TEndpoint }, getApiEndpointProxyHandler<TSpec, TEndpoint>());
            if ('base' === prop)
                return target;
            return undefined;
        }
    };
}
/** @internal */
function getApiEndpointProxyHandler<TSpec extends EndpointsSpec, TEndpoint extends keyof TSpec>():
    ProxyHandler<TeemoApiEndpoint<TSpec, TEndpoint>>
{
    return {
        get<TMethod extends keyof TSpec[TEndpoint]>(target: TeemoApiEndpoint<TSpec, TEndpoint>, prop: TMethod | string | number | symbol, _receiver: unknown) {
            if (prop in target.base.config.endpoints[target.endpoint])
                return (
                    region: ReqRoutes<TSpec[TEndpoint][TMethod]>,
                    ...kwargs: ReqArgsTuple<TSpec[TEndpoint][TMethod]>
                ): ReqReturn<TSpec[TEndpoint][TMethod]> =>
                    target.base.req(target.endpoint, prop as TMethod, region, ...kwargs);
            return undefined;
        }
    };
}
