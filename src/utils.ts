export const objFromEntries = (Object as any).fromEntries || function(entries: Array<[ string, any ]>) {
    const obj: { [key: string]: any } = {};
    entries.forEach(([ key, val ]) => obj[key] = val);
    return obj;
};

/**
 * Returns a formatted string, replacing "{}", "{name}", or "{0}" with supplied ARGOBJECT.
 * ARGOBJECT may be an object or Array.
 */
export function format(format: string, argObject: Array<any> | { [K in string | number]: any }): string {
    let i = 0;
    const result = format.replace(/\{(\w*)\}/g, (_, key) => {
        const val = undefined !== argObject[key] ? argObject[key] : argObject[i];
        if (undefined === val)
            throw new Error(`Argument provided for format "${format}" missing key "{${key}}" or index ${i}.`);
        i++;
        return val;
    });
    return result;
}

/** Returns a promise that resolves after the supplied delay. */
export function delayPromise(millis: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, millis));
}

/**
 * Assigns VALUE into OBJECT at location PATH, where PATH is a period-dilimited set of segments. For example,
 * `"foo.bar"` would run `object.foo.bar = value`. But also fills in undefined values with new objects.
 */
export function assignPath(object: any, path: string, value: any): void {
    const segments = path.split('.');
    const final = segments.pop() as string; // Split always gives at least one item (barring invalid input).
    for (const segment of segments)
        object = undefined !== object[segment] ? object[segment] : (object[segment] = {});
    object[final] = value;
}
