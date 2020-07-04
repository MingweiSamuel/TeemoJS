type Args = { [argName: string]: any };
type MethodSpec<TArgs extends Args, TReturn> = {
    path: string,
}
type EndpointsSpec = {
    [endpoint: string]: {
        [method: string]: MethodSpec<any, any>
    }
}

type MethodArgs<TSpec extends EndpointsSpec, TEndpoint extends keyof TSpec, TMethod extends keyof TSpec[TEndpoint]> =
    TSpec[TEndpoint][TMethod] extends MethodSpec<infer TArgs, any> ? TArgs extends Args ? TArgs : Args : Args;

type MethodReturn<TSpec extends EndpointsSpec, TEndpoint extends keyof TSpec, TMethod extends keyof TSpec[TEndpoint]> =
    TSpec[TEndpoint][TMethod] extends MethodSpec<any, infer TReturn> ? Promise<TReturn> : Promise<any>;

type RiotApiFluent<TSpec extends EndpointsSpec> = {
    [TEndpoint in keyof TSpec]: {
        [TMethod in keyof TSpec[TEndpoint]]:
            TSpec[TEndpoint][TMethod] extends { fn: Function | null }
                ? NonNullable<TSpec[TEndpoint][TMethod]['fn']>
                : (region: Region | string, args: MethodArgs<TSpec, TEndpoint, TMethod>) => MethodReturn<TSpec, TEndpoint, TMethod>;
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

    req<TEndpoint extends keyof TSpec, TMethod extends keyof TSpec[TEndpoint]>(
        endpoint: TEndpoint,
        method: TMethod,
        region: Region | string,
        args: MethodArgs<TSpec, TEndpoint, TMethod>,
    ): MethodReturn<TSpec, TEndpoint, TMethod>;
    req(endpoint: string, method: string, region: Region | string, args: Args): any
    {
        // TODO
        return null;
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
                return (region: Region, args: MethodArgs<TSpec, TEndpoint, TMethod>): any =>
                    target.base.req(target.endpoint, prop as TMethod, region, args);
            }
            return Reflect.get(target, prop, receiver);
        },
        set: () => false,
    };
}

exports.RiotApi = RiotApi;
