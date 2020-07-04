/**
 * Rate limit. A collection of token buckets, updated when needed.
 * @internal
 */
class RateLimit {
    /**
     * Get tokens for a single request from all the given rate limits or a delay to wait.
     * Returns -1 if tokens were obtained and the request can proceed, otherwise a positive value in milliseconds to
     * delay.
     */
    static getAllOrDelay(rateLimits: RateLimit[]) {
        const delay = rateLimits
            .map(r => r.retryDelay())
            .reduce((a, b, _idx, _arr) => Math.max(a, b), -1);
        if (0 <= delay)
            return delay; // Techincally the delay could be more but whatever.
        const allBuckets = [].concat.apply([], rateLimits.map(rl => rl._buckets));
        return TokenBucket.getAllOrDelay(allBuckets);
    }

    private readonly _config: Config;
    private readonly _type: RateLimitType;

    private _buckets: TokenBucket[];
    private _retryAfter: number;
    private _distFactor: number

    constructor(type: RateLimitType, distFactor: number, config: Config) {
        this._config = config;
        this._type = type;
        this._buckets = this._config.defaultBuckets.map(b => new TokenBucket(b.timespan, b.limit, b));
        this._retryAfter = 0;
        this._distFactor = distFactor;
    }

    retryDelay(): number {
        const now: number = Date.now();
        return now > this._retryAfter ? -1 : this._retryAfter - now;
    }

    onResponse(response: import("node-fetch").Response): void {
        // Handle 429 retry-after header (if exists).
        if (429 === response.status) {
            const type = this._config.headerLimitType ? response.headers.get(this._config.headerLimitType) : this._config.defaultLimitType;
            if (!type)
                throw new Error('Response missing type.');
            if (this._type.name === type.toLowerCase()) {
                let retryAfter = Number(response.headers.get(this._config.headerRetryAfter));
                if (Number.isNaN(retryAfter))
                    throw new Error('Response 429 missing retry-after header.');
                this._retryAfter = Date.now() + retryAfter * 1000 + 500;
            }
        }
        // Update rate limit from headers (if changed).
        const limitHeader: null | string = response.headers.get(this._type.headerLimit);
        const countHeader: null | string = response.headers.get(this._type.headerCount);
        if (limitHeader && countHeader && this._bucketsNeedUpdate(limitHeader))
            this._buckets = this._getBucketsFromHeaders(limitHeader, countHeader, this._config.bucketsConfig);
    }

    setDistFactor(factor: number): void {
        this._distFactor = factor;
        this._buckets.forEach(b => b.setDistFactor(factor));
    }

    // PRIVATE METHODS
    private _bucketsNeedUpdate(limitHeader: string): boolean {
        const limits: string = this._buckets.map(b => b.toLimitString()).join(',');
        return limitHeader !== limits;
    }

    private _getBucketsFromHeaders(limitHeader: string, countHeader: string, bucketsConfig: TokenBucketConfig = {}): TokenBucket[] {
        // Limits: "20000:10,1200000:600"
        // Counts: "7:10,58:600"
        let limits: string[] = limitHeader.split(',');
        let counts: string[] = countHeader.split(',');
        if (limits.length !== counts.length)
            throw new Error(`Limit and count headers do not match: ${limitHeader}, ${countHeader}.`);
    
        return limits
            .map((limit, i) => {
                const count = counts[i];
                // Spans are in seconds (not millis), so they must be multiplied by 1000.
                const [ limitVal, limitSpan ] = limit.split(':').map(Number);
                const [ countVal, countSpan ] = count.split(':').map(Number);
                if (limitSpan !== countSpan)
                    throw new Error(`Limit span and count span do not match: ${limitSpan}, ${countSpan}.`);
    
                const bucket = new TokenBucket(1000 * limitSpan, limitVal, { distFactor: this._distFactor, ...bucketsConfig });
                bucket.getTokens(countVal);
                return bucket;
            });
    }
}
