/** @internal */
class Semaphore {

    private _permits: number;
    private readonly _queue: Array<() => void>;

    constructor(count: number) {
        this._permits = count;
        this._queue = [];
    }

    acquire(): Promise<void> {
        return new Promise((resolve: () => void) => {
            if (this._permits) {
                this._permits--;
                resolve();
            }
            else
                this._queue.push(resolve);
        });
    }

    release(): void {
        const resolve: (() => void) | undefined = this._queue.shift();
        (resolve ? resolve() : this._permits++);
    }
}
