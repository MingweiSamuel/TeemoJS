type Args = { [argName: string]: any };
type MethodSpec<ARGS, RETURNTYPE extends Args> = {
    path: string,
}
type EndpointsSpec = {
    [endpoint: string]: {
        [method: string]: MethodSpec<any, any>
    }
}

type EndpointMethods<T extends EndpointsSpec> = {
    [ENDPOINT in keyof T]: {
        [METHOD in keyof T[ENDPOINT]]:
            // NonNullable<T[ENDPOINT][METHOD]['fn']>;
            T[ENDPOINT][METHOD] extends { fn: Function | null }
                ? NonNullable<T[ENDPOINT][METHOD]['fn']>
                : (region: Region | string, args?: object | Array<any>) => any;
    };
};


class RiotApi<T extends EndpointsSpec> {
    readonly endpoints: T;

    private readonly _config: Config;
    private readonly _regions: { [key: string]: { [region: string]: RegionalRequester } };

    constructor(endpoints: T, config: Config) {
        this.endpoints = endpoints;

        this._config = config;
        this._regions = {};

        return new Proxy(this, getRiotApiProxyHandler());
    }

    req<ENDPOINT extends keyof T, METHOD extends keyof T[ENDPOINT]>(
        endpoint: ENDPOINT,
        method: METHOD,
        args: T[ENDPOINT][METHOD] extends MethodSpec<infer ARGS, any> ? ARGS extends Args ? ARGS : Args : Args,
    ): T[ENDPOINT][METHOD] extends MethodSpec<any, infer RETURNTYPE> ? RETURNTYPE : any;
    req(endpoint: string, method: string, args: Args): any
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
interface RiotApiEndpoint<T extends EndpointsSpec> {
    base: RiotApi<T>,
    endpoint: keyof T;
}

/** @internal */
function getRiotApiProxyHandler<T extends EndpointsSpec>(): ProxyHandler<RiotApi<T>> {
    return {
        get(target: RiotApi<T>, prop: string | number | symbol, receiver: unknown) {
            if ('string' === typeof prop && prop in target.endpoints) {
                const ep: RiotApiEndpoint<T> = { base: target, endpoint: prop };
                return new Proxy(ep, getRiotApiEndpointProxyHandler<T>());
            }
            return Reflect.get(target, prop, receiver);
        },
        set: () => false,
    };
}
/** @internal */
function getRiotApiEndpointProxyHandler<T extends EndpointsSpec>(): ProxyHandler<RiotApiEndpoint<T>> {
    return {
        get(target: RiotApiEndpoint<T>, prop: string | number | symbol, receiver: unknown) {
            if ('string' === typeof prop && prop in target.base.endpoints[target.endpoint]) {
                return (region: Region, args?: Args): any =>
                    target.base.req(target.endpoint, prop, region, args);
            }
            return Reflect.get(target, prop, receiver);
        },
        set: () => false,
    };
}

exports.RiotApi = RiotApi;
