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
    static getAllOrDelay(tokenBuckets: TokenBucket[]): number {
        const delay = tokenBuckets
            .map(b => b.getDelay())
            .reduce((a, b) => Math.max(a, b), -1);
        if (delay >= 0)
            return delay;
        tokenBuckets.forEach(b => b.getTokens(1));
        return -1;
    }

    private readonly _now: () => number;

    // Given values for checking equality when updating buckets.
    private readonly _givenTimespan: number;
    private readonly _givenLimit: number;

    // Configuration values.
    private readonly _binFactor: number;
    private readonly _timespan: number;
    private readonly _binTimespan: number; // Timespan per bin.

    // Fields that track requests, (change frequently).
    private _total: number;
    private _time: number;
    private readonly _buffer: number[];

    // Limits change when distFactor changes.
    private _limit!: number;
    private _binLimit!: number;

    constructor(timespan: number, limit: number, config: TokenBucketConfig = {}, now: (() => number) = Date.now) {
        const { distFactor, bins, binFactor, overhead } = { ...TOKENBUCKETCONFIG_DEFAULT, ...config };
        if (binFactor <= 0 || 1 < binFactor) throw new Error(`binFactor ${binFactor} must be in range (0, 1].`);

        this._now = now;

        // Given values for checking equality when updating buckets.
        this._givenTimespan = timespan;
        this._givenLimit = limit;
        
        // Configuration values (rarely change).
        this._binFactor = binFactor;
        this._timespan = timespan + overhead;
        this._binTimespan = Math.ceil(this._timespan / bins); // Timespan per bin.

        // Fields that track requests, (change frequently).
        this._total = 0;
        this._time = -1;
        this._buffer = new Array(bins + 1).fill(0);

        this.setDistFactor(distFactor);
    }

    setDistFactor(distFactor: number): void {
        this._limit = this._givenLimit * distFactor;
        this._binLimit = Math.max(1, Math.floor(this._limit * this._binFactor));
    }

    /** Returns delay in milliseconds or -1 if token available. */
    getDelay(): number {
        const index: number = this._update();
        if (this._limit > this._total) {
            if (this._binLimit <= this._buffer[index])
                return this._getTimeToBucket(1);
            return -1;
        }
    
        // Check how soon into the future old buckets will be zeroed, making requests available.
        let i: number = 1;
        for (; this._buffer.length > i; i++) {
            if (0 < this._buffer[(index + i) % this._buffer.length])
                break;
        }
        return this._getTimeToBucket(i);
    }

    getTokens(n: number): boolean {
        const index = this._update();
        this._buffer[index] += n;
        this._total += n;
        return this._total <= this._limit && this._buffer[index] <= this._binLimit;
    }

    toLimitString(): string {
        return `${this._givenLimit}:${this._givenTimespan / 1000}`;
    }

    // PRIVATE METHODS
    /**
     * Update the internal state for the current time.
     * Returns the index of the current buffer bin.
     */
    private _update(): number {
        if (0 > this._time) {
            this._time = this._now();
            return this._getIndex(this._time);
        }
    
        let index = this._getIndex(this._time);
        const length = this._getLength(this._time, (this._time = this._now()));
    
        if (0 > length)
            throw new Error('Negative length.');
        if (0 === length)
            return index;
        if (this._buffer.length <= length) {
            this._buffer.fill(0);
            this._total = 0;
            return index;
        }
        for (let i = 0; length > i; i++) {
            index++; index %= this._buffer.length;
            this._total -= this._buffer[index];
            this._buffer[index] = 0;
        }
        if (this._getIndex(this._time) !== index)
            throw new Error(`Get index time wrong: ${this._getIndex(this._time)}, ${index}.`);
        return index;
    }

    /** Returns the index of the given epoch millisecond timestamp. */
    private _getIndex(ts: number): number {
        return Math.floor((ts / this._binTimespan) % this._buffer.length);
    }

    /** Returns the index difference of the two given epoch millisecond timestamps. */
    private _getLength(start: number, end: number): number {
        return Math.floor(end / this._binTimespan) - Math.floor(start / this._binTimespan);
    }

    /** Returns the time needed for N buckets to pass. */
    private _getTimeToBucket(n: number): number {
        return n * this._binTimespan - (this._time % this._binTimespan);
    }
}
