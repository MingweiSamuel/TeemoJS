/** @internal */
class Semaphore {

    private permits: number;
    private queue: Array<() => void>;

    constructor(count: number) {
        this.permits = count;
        this.queue = [];
    }

    acquire(): Promise<void> {
        return new Promise((resolve: () => void) => {
            if (this.permits) {
                this.permits--;
                resolve();
            }
            else
                this.queue.push(resolve);
        });
    }

    release(): void {
        const resolve: (() => void) | undefined = this.queue.shift();
        (resolve ? resolve() : this.permits++);
    }
}
