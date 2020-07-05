type NamedParams = { [argName: string]: any };
type OrderedParams = NamedParams | any[];
type MethodSpec<TReturn, TPathParams extends OrderedParams, TQueryParams extends NamedParams, TBodyParam> = {
    path: string,
}
type EndpointsSpec = {
    [endpoint: string]: {
        [method: string]: MethodSpec<any, any, any, any>
    }
}
