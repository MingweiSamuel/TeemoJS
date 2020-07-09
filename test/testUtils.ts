export function delayPromise(millis: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, millis));
}
