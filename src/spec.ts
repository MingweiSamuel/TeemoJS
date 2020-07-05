namespace spec {
    /** Named query parameters. */
    export type NamedParams = { [argName: string]: unknown };
    /** Named or ordered path parameters. */
    export type OrderedParams = { [argIdx: number]: unknown };

    /**
     * ReqSpec with optional type parameters for annotating the input parameters and return type.
     */
    export type ReqSpec<_TReturn, _TPath extends OrderedParams | NamedParams, _TQuery extends NamedParams, _TBody> = {
        path: string,
        method?: import("node-fetch").RequestInit['method'],
        apiKeyName?: string,
    };

    /** Listing of endpoints. */
    export type EndpointsSpec = {
        [endpoint: string]: {
            [method: string]: ReqSpec<any, any, any, any>
        }
    };

    /** Utility type which extracts Promise<TReturn> from a ReqSpec. */
    export type ReqReturn<TReqSpec extends ReqSpec<any, any, any, any>> =
        TReqSpec extends ReqSpec<infer TReturn, any, any, any>
            ? Promise<TReturn>
        : never;

    /** Utility type which creates a { path, query, body } kwargs type from a ReqSpec. */
    export type ReqArgs<TReqSpec extends ReqSpec<any, any, any, any>> =
        TReqSpec extends ReqSpec<any, infer TPath, infer TQuery, infer TBody>
            ? (
                ({} extends TPath
                    ? { path?: TPath | null }
                : { path: TPath })
                &
                ({} extends TQuery
                    ? { query?: TQuery | null }
                : { query: TQuery })
                &
                (undefined extends TBody
                    ? { body?: TBody }
                : { body: TBody })
            )
        : {
            path?: OrderedParams | NamedParams | null,
            query?: NamedParams | null,
            body?: any,
        };

    /** ReqArgs but as a tuple so optional paramters can be spread. */
    export type ReqArgsTuple<TReqSpec extends ReqSpec<any, any, any, any>> =
        {} extends ReqArgs<TReqSpec> ? [ ReqArgs<TReqSpec>? ] : [ ReqArgs<TReqSpec> ];
}

exports.spec = spec;
