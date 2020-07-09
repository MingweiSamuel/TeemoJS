/**
 * URL class.
 * @internal
 */
const URL: typeof import("url").URL = (global as any).URL || require("url").URL;

/**
 * Fetch api.
 * @internal
 */
const fetch: fetch = (global as any).fetch || require("node-fetch");

/**
 * Object.fromEntries
 * @internal
 */
const objFromEntries: (<T>(entries: Array<[ string, T ]>) => { [key: string]: T })
    = (Object as any).fromEntries
    || function<T>(entries: Array<[ string, T ]>): { [key: string]: T }
{
    const obj: { [key: string]: T } = {};
    entries.forEach(([ key, val ]) => obj[key] = val);
    return obj;
};

/**
 * Returns a formatted string, replacing "{}", "{name}", or "{0}" with supplied ARG_OBJECT.
 * ARG_OBJECT may be an object or Array.
 * @internal
 */
function format(format: string, argObject: NamedParams | OrderedParams): string {
    let i = 0;
    const result = format.replace(/\{(\w*)\}/g, (_, key: string) => {
        const val: unknown = key in argObject ? (argObject as NamedParams)[key] : (argObject as OrderedParams)[i];
        if (undefined === val)
            throw new Error(`argObject provided for format "${format}" missing key ["${key}"] or index [${i}].`);
        i++;
        return val as string; // Will be converted to string.
    });
    return result;
}

/**
 * Assigns VALUE into OBJECT at location PATH, where PATH is a period-dilimited set of segments. For example,
 * `"foo.bar"` would run `object.foo.bar = value`. But also fills in undefined values with new objects.
 * @internal
 */
function assignPath(object: any, path: string, value: any): void {
    const segments = path.split('.');
    const final = segments.pop() as string; // Split always gives at least one item (barring invalid input).
    for (const segment of segments)
        object = undefined !== object[segment] ? object[segment] : (object[segment] = {});
    object[final] = value;
}
