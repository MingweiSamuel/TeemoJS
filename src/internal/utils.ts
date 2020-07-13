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
 * Non-cryptographic string hash, implemented as Java's String.hashCode().
 * @param str String to hash.
 * @internal
 */
function strHash(str: string): int {
    return Array.from(str).reduce((hash, char) => 0 | (31 * hash + char.charCodeAt(0)), 0);
}
