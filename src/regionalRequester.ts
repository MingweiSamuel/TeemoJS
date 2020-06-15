import { RateLimit } from "./rateLimit";
import { Semaphore } from "./semaphore";

/** Regional Requester. Handles `RateLimit`s for a region. One app limit and multiple method limits. */
export class Region {

    private readonly config: TODO;

    private appLimit: RateLimit;
    private readonly methodLimits: { [methodId: string]: RateLimit };
    private readonly concurrentSema: Semaphore;


    constructor(config: TODO) {
        this.config = config;

        this.appLimit = new RateLimit(this.config.rateLimitTypeApplication, 1, this.config);
        this.methodLimits = {};
        this.concurrentSema = new Semaphore(this.config.maxConcurrent);
    }

    req(methodId: string, url: string, fetchConfig: TODO) {
        // Get rate limits to obey.
        const rateLimits: Array<RateLimit> = [ this.appLimit ];
        if (this.config.rateLimitTypeMethod) // Also method limit if applicable.
            rateLimits.push(this._getMethodLimit(methodId));
    
        return (async () => {
            let response: TODO;
            let retries: number;

            // Fetch retry loop.
            for (retries = 0; retries < this.config.retries; retries++) {
                // Acquire concurrent request permit.
                // Note: This includes the time spent waiting for rate limits. To obey the rate limit we need to send the request
                //             immediately after delaying, otherwise the request could be delayed into a different bucket.
                await this.concurrentSema.acquire();
                try {
                    // Wait for rate limits.
                    let delay: number;
                    while (0 <= (delay = RateLimit.getAllOrDelay(rateLimits)))
                        await delayPromise(delay);
                    // Send request, get response.
                    response = await fetch(url, fetchConfig);
                }
                finally {
                    // Release concurrent request permit.
                    // Note: This may be released before the full response body is read.
                    this.concurrentSema.release();
                }
    
                // Update if rate limits changed or 429 returned.
                rateLimits.forEach(rl => rl.onResponse(response));
    
                // Handle status codes.
                if ([ 204, 404, 422 ].includes(response.status)) // Successful response, but no data found.
                    return null;
                if (response.ok) // Successful response (presumably) with body.
                    return await response.json();
                if (429 !== response.status && response.status < 500) // Non-retryable responses.
                    break;
            }
            // Request failed.
            const err = new Error(`Request failed after ${retries} retries with code ${response.status}. ` +
                "The 'response' field of this Error contains the failed Response for debugging or error handling.");
            err.response = response;
            throw err;
        })();
    }

    updateDistFactor() {
        this.appLimit.setDistFactor(this.config.distFactor);
        Object.values(this.methodLimits).forEach(rl => rl.setDistFactor(this.config.distFactor));
    }

    // PRIVATE METHODS

    private _getMethodLimit(methodId: string): RateLimit {
        return this.methodLimits[methodId] ||
            (this.methodLimits[methodId] = new RateLimit(this.config.rateLimitTypeMethod, 1, this.config));
    }
}
