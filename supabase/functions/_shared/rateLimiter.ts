// Simple Token Bucket Rate Limiter
// Note: In production with multiple instances, use Redis. For single instance/dev, this in-memory cache works.

import LRU from "https://deno.land/x/lru_cache@6.0.0/mod.ts";

const cache = new LRU<string, { tokens: number; last: number }>(5000); // Max 5000 users

export function allowRequest(
    key: string,
    rate = 10,   // tokens per second refill
    burst = 100  // max tokens
): boolean {
    const now = Date.now();
    let entry = cache.get(key);

    if (!entry) {
        entry = { tokens: burst, last: now };
    }

    const elapsedSeconds = (now - entry.last) / 1000;
    const newTokens = elapsedSeconds * rate;

    entry.tokens = Math.min(burst, entry.tokens + newTokens);
    entry.last = now;

    if (entry.tokens >= 1) {
        entry.tokens -= 1;
        cache.set(key, entry);
        return true;
    }

    cache.set(key, entry);
    return false;
}
