interface RateLimitBucket {
  limit: number;
  remaining: number;
  used: number;
  reset: number; // UTC epoch seconds
}

interface RateLimitResponse {
  resources: {
    core: RateLimitBucket;
    search: RateLimitBucket;
    [category: string]: RateLimitBucket;
  };
}

export interface CoreRateLimit {
  remaining: number;
  resetsAt: Date;
}

/**
 * Returns how many regular (non-search) REST requests the token has left
 * and when that allowance resets. Calling /rate_limit does not count
 * against the limit.
 */
export async function getCoreRateLimit(token: string): Promise<CoreRateLimit> {
  const response = await fetch("https://api.github.com/rate_limit", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2026-03-10",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub rate limit request failed: ${response.status} ${response.statusText}`,
    );
  }

  const { resources } = (await response.json()) as RateLimitResponse;
  // `core` covers non-search REST endpoints; the top-level `rate` object is being phased out.
  const { remaining, reset } = resources.core;

  return { remaining, resetsAt: new Date(reset * 1000) };
}
