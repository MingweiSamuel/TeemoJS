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
