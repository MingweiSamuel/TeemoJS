/**
 * Default token bucket configuration.
 * @internal
 */
const TOKENBUCKETCONFIG_DEFAULT = {
    distFactor: 1,
    bins: 20,
    binFactor: 0.95,
    overhead: 20,
}

/**
 * Token bucket. Represents a single "100:60", AKA a 100 tokens per 60 seconds pair.
 * `bins`: Number of discrete bins to count into per timespan. `limit * binFactor` tokens alloted per bin.
 * `binFactor`: Value in range (0, 1], representing the fraction of `limit` requests allowed per bin.
 * `Overhead`: Time to extend `timespan` by in milliseconds. This is to prevent literal edge cases where requests can
 *     be counted into the wrong bucket, causing 429s.
 * `now`: Function which returns millisecond time.
 * `distFactor`: Value in range (0, 1] representing the fraction of the total rate limit this instance can use.
 * @internal
 */
class TokenBucket {

    /**
     * Get one token from all the given token buckets or a delay to wait.
     * Returns -1 if tokens were obtained, otherwise a positive value in milliseconds to delay.
     */
    static getAllOrDelay(tokenBuckets: Array<TokenBucket>): number {
        const delay = tokenBuckets
            .map(b => b.getDelay())
            .reduce((a, b) => Math.max(a, b), -1);
        if (delay >= 0)
            return delay;
        tokenBuckets.forEach(b => b.getTokens(1));
        return -1;
    }

    private now: () => number;

    // Given values for checking equality when updating buckets.
    private readonly givenTimespan: number;
    private readonly givenLimit: number;

    // Configuration values (rarely change).
    private binFactor: number;
    private timespan: number;
    private binTimespan: number; // Timespan per bin.

    // Fields that track requests, (change frequently).
    private total: number;
    private time: number;
    private buffer: Array<number>;

    private limit!: number;
    private binLimit!: number;

    constructor(timespan: number, limit: number, config: TokenBucketConfig = {}, now: (() => number) = Date.now) {
        const { distFactor, bins, binFactor, overhead } = { ...TOKENBUCKETCONFIG_DEFAULT, ...config };
        if (binFactor <= 0 || 1 < binFactor) throw new Error(`binFactor ${binFactor} must be in range (0, 1].`);

        this.now = now;

        // Given values for checking equality when updating buckets.
        this.givenTimespan = timespan;
        this.givenLimit = limit;
        
        // Configuration values (rarely change).
        this.binFactor = binFactor;
        this.timespan = timespan + overhead;
        this.binTimespan = Math.ceil(this.timespan / bins); // Timespan per bin.

        // Fields that track requests, (change frequently).
        this.total = 0;
        this.time = -1;
        this.buffer = new Array(bins + 1).fill(0);

        this.setDistFactor(distFactor);
    }

    setDistFactor(distFactor: number): void {
        this.limit = this.givenLimit * distFactor;
        this.binLimit = Math.max(1, Math.floor(this.limit * this.binFactor));
    }

    /** Returns delay in milliseconds or -1 if token available. */
    getDelay(): number {
        const index: number = this._update();
        if (this.limit > this.total) {
            if (this.binLimit <= this.buffer[index])
                return this._getTimeToBucket(1);
            return -1;
        }
    
        // Check how soon into the future old buckets will be zeroed, making requests available.
        let i: number = 1;
        for (; this.buffer.length > i; i++) {
            if (0 < this.buffer[(index + i) % this.buffer.length])
                break;
        }
        return this._getTimeToBucket(i);
    }

    getTokens(n: number): boolean {
        const index = this._update();
        this.buffer[index] += n;
        this.total += n;
        return this.total <= this.limit && this.buffer[index] <= this.binLimit;
    }

    toLimitString(): string {
        return `${this.givenLimit}:${this.givenTimespan / 1000}`;
    }

    // PRIVATE METHODS
    /**
     * Update the internal state for the current time.
     * Returns the index of the current buffer bin.
     */
    private _update(): number {
        if (0 > this.time) {
            this.time = this.now();
            return this._getIndex(this.time);
        }
    
        let index = this._getIndex(this.time);
        const length = this._getLength(this.time, (this.time = this.now()));
    
        if (0 > length)
            throw new Error('Negative length.');
        if (0 === length)
            return index;
        if (this.buffer.length <= length) {
            this.buffer.fill(0);
            this.total = 0;
            return index;
        }
        for (let i = 0; length > i; i++) {
            index++; index %= this.buffer.length;
            this.total -= this.buffer[index];
            this.buffer[index] = 0;
        }
        if (this._getIndex(this.time) !== index)
            throw new Error(`Get index time wrong: ${this._getIndex(this.time)}, ${index}.`);
        return index;
    }

    /** Returns the index of the given epoch millisecond timestamp. */
    private _getIndex(ts: number): number {
        return Math.floor((ts / this.binTimespan) % this.buffer.length);
    }

    /** Returns the index difference of the two given epoch millisecond timestamps. */
    private _getLength(start: number, end: number): number {
        return Math.floor(end / this.binTimespan) - Math.floor(start / this.binTimespan);
    }

    /** Returns the time needed for N buckets to pass. */
    private _getTimeToBucket(n: number): number {
        return n * this.binTimespan - (this.time % this.binTimespan);
    }
}
