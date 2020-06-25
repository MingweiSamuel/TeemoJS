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
    static getAllOrDelay(rateLimits: Array<RateLimit>) {
        const delay = rateLimits
            .map(r => r.retryDelay())
            .reduce((a, b, _idx, _arr) => Math.max(a, b), -1);
        if (0 <= delay)
            return delay; // Techincally the delay could be more but whatever.
        const allBuckets = [].concat.apply([], rateLimits.map(rl => rl.buckets));
        return TokenBucket.getAllOrDelay(allBuckets);
    }

    private readonly config: Config;
    private readonly type: RateLimitType;

    private buckets: Array<TokenBucket>;
    private retryAfter: number;
    private distFactor: number

    constructor(type: RateLimitType, distFactor: number, config: Config) {
        this.config = config;
        this.type = type;
        this.buckets = this.config.defaultBuckets.map(b => new TokenBucket(b.timespan, b.limit, b));
        this.retryAfter = 0;
        this.distFactor = distFactor;
    }

    retryDelay(): number {
        const now: number = Date.now();
        return now > this.retryAfter ? -1 : this.retryAfter - now;
    }

    onResponse(response: import("node-fetch").Response): void {
        // Handle 429 retry-after header (if exists).
        if (429 === response.status) {
            const type = this.config.headerLimitType ? response.headers.get(this.config.headerLimitType) : this.config.defaultLimitType;
            if (!type)
                throw new Error('Response missing type.');
            if (this.type.name === type.toLowerCase()) {
                let retryAfter = Number(response.headers.get(this.config.headerRetryAfter));
                if (Number.isNaN(retryAfter))
                    throw new Error('Response 429 missing retry-after header.');
                this.retryAfter = Date.now() + retryAfter * 1000 + 500;
            }
        }
        // Update rate limit from headers (if changed).
        const limitHeader: null | string = response.headers.get(this.type.headerLimit);
        const countHeader: null | string = response.headers.get(this.type.headerCount);
        if (limitHeader && countHeader && this._bucketsNeedUpdate(limitHeader))
            this.buckets = this._getBucketsFromHeaders(limitHeader, countHeader, this.config.bucketsConfig);
    }

    setDistFactor(factor: number): void {
        this.distFactor = factor;
        this.buckets.forEach(b => b.setDistFactor(factor));
    }

    // PRIVATE METHODS
    private _bucketsNeedUpdate(limitHeader: string): boolean {
        const limits: string = this.buckets.map(b => b.toLimitString()).join(',');
        return limitHeader !== limits;
    }

    private _getBucketsFromHeaders(limitHeader: string, countHeader: string, bucketsConfig: TokenBucketConfig = {}): Array<TokenBucket> {
        // Limits: "20000:10,1200000:600"
        // Counts: "7:10,58:600"
        let limits: Array<string> = limitHeader.split(',');
        let counts: Array<string> = countHeader.split(',');
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
    
                const bucket = new TokenBucket(1000 * limitSpan, limitVal, { distFactor: this.distFactor, ...bucketsConfig });
                bucket.getTokens(countVal);
                return bucket;
            });
    }
}
