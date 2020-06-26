/** @internal */
interface RiotApiEndpoint {
    base: RiotApi,
    endpoint: string,
}

/** @internal */
const RiotApiEndpointProxyHandler: ProxyHandler<RiotApiEndpoint> = {
    get(target: RiotApiEndpoint, prop: string | number | symbol, receiver: any) {
        if ('string' === typeof prop)
            return (region: Region, args?: object | Array<any>): any =>
                target.base.req(target.endpoint, prop, region, args);
        return Reflect.get(target, prop, receiver);
    },
    set: () => false,
};

/** @internal */
const RiotApiProxyHandler: ProxyHandler<RiotApi> = {
    get(target: RiotApi, prop: string | number | symbol, receiver: any) {
        if ('summonerV4' === prop)
            return new Proxy({ base: target, endpoint: prop }, RiotApiEndpointProxyHandler);
        return Reflect.get(target, prop, receiver);
    },
    set: () => false,
};

class RiotApi {
    private readonly _config: Config;
    private readonly _regions: { [methodId: string]: RegionalRequester };

    constructor(config: Config) {
        this._config = config;
        this._regions = {};

        return new Proxy(this, RiotApiProxyHandler);
    }

    req(endpoint: string, method: string, region: Region | string, args?: object | Array<any>): object | null {
        return null;
    }

    reqInternal(region: Region | string, methodId: string, urlStr: string, fetchConfig: import("node-fetch").RequestInit): object | null {
        const x: import("url").URL = new URL('asdf', 'qwer');
        return null;

        // // Get region (first arg, or not).
        // let region = this.config.regionPath ? args.shift() : null;
        // let [ target, pathParams = {}, queryParams = {}, bodyParam = undefined ] = args;

        // // Get reqConfigs.
        // const reqConfigs = [];
        // let endpointTree = this.config.endpoints;
        // for (const segment of target.split('.')) {
        //     if (endpointTree['*']) reqConfigs.push(endpointTree['*'])
        //     if (!(endpointTree = endpointTree[segment])) throw new Error(`Missing path segment "${segment}" in "${target}".`);
        // }
        // reqConfigs.push(endpointTree);
        // // Assemble reqConfig.
        // const reqConfig = Object.assign({}, ...reqConfigs);
        // if (typeof reqConfig.path !== 'string') throw new Error(`Failed to find path for target: "${target}".`);
        // reqConfig.fetch = Object.assign({ keepalive: true, redirect: 'follow', headers: {} }, ...reqConfigs.map(rc => rc.fetch));
        // reqConfig.fetch.headers = Object.assign({}, ...reqConfigs.map(rc => rc.fetch && rc.fetch.headers));
        // reqConfig.pathParams = Object.assign({}, ...reqConfigs.map(rc => rc.pathParams), pathParams);
        // reqConfig.queryParams = Object.assign({}, ...reqConfigs.map(rc => rc.queryParams), queryParams);
        // reqConfig.bodyParam || (reqConfig.bodyParam = bodyParam);
        // // Override key.
        // const key = reqConfig.key || this.config.key || null;
        // if (this.config.keyPath) assignPath(reqConfig, this.config.keyPath, key);
        // // Lookup regions.
        // if (this.config.regionPath) {
        //     if (!reqConfig.regionTable[region]) throw new Error('Failed to determine platform for region: ' +
        //     `"${region}", available regions (for this endpoint): ${Object.keys(reqConfig.regionTable).join(', ')}.`)
        //     assignPath(reqConfig, this.config.regionPath, reqConfig.regionTable[region]);
        // }

        // // OriginParams. But first override origin.
        // let origin = reqConfig.origin || this.config.origin;
        // if (reqConfig.originParams) origin = format(origin, reqConfig.originParams);

        // // PathParams. Interpolate path.
        // if (Array.isArray(pathParams)) // Array.
        //     pathParams = pathParams.map(encodeURIComponent);
        // else if (typeof pathParams === 'object') // Object dict.
        //     pathParams = objFromEntries(Object.entries(pathParams).map(([ key, val ]) => [ key, encodeURIComponent(val) ]));
        // else // Single value.
        //     pathParams = [ pathParams ];
        // const path = format(reqConfig.path, pathParams);

        // // QueryParams. First build URL.
        // const urlBuilder = new URL(path, format(origin, [ region ]));
        // // Then build URL query params.
        // for (const [ key, vals ] of Object.entries(reqConfig.queryParams)) {
        //     if (!Array.isArray(vals)) // Not array.
        //     urlBuilder.searchParams.set(key, vals);
        //     else if (this.config.collapseQueryArrays) // Array, collapse.
        //     urlBuilder.searchParams.set(key, vals.join(','));
        //     else // Array, do not collapse.
        //     vals.forEach(val => urlBuilder.searchParams.append(key, val));
        // }

        // // BodyParam. Add body, if supplied, to reqConfig.fetch.
        // if (undefined !== bodyParam) {
        //     reqConfig.fetch.body = JSON.stringify(bodyParam);
        //     reqConfig.fetch.headers['Content-Type'] = 'application/json';
        // }

        // return this._getRegion(region).req(target, urlBuilder.href, reqConfig.fetch);
    }
}

exports.RiotApi = RiotApi;
