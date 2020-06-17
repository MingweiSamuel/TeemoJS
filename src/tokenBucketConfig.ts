export interface TokenBucketConfig {
    distFactor?: number,
    bins?: number,
    binFactor?: number,
    overhead?: number,
}

/// For defualt token buckets before rate limits are known.
export interface TokenBucketDefaultConfig extends TokenBucketConfig {
    timespan: number,
    limit: number,
}
