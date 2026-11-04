interface RateLimitBucket {
  limit: number;
  used: number;
  remaining: number;
  /** UTC epoch seconds */
  reset: number;
}

interface RateLimitResponse {
  resources: {
    core: RateLimitBucket;
    search?: RateLimitBucket;
    [name: string]: RateLimitBucket | undefined;
  };
}

export interface CoreRateLimit {
  remaining: number;
  resetsAt: Date;
}

/**
 * Returns how many regular (non-search) REST requests the token has left,
 * and when that allowance resets. Uses the "core" bucket of GET /rate_limit,
 * which does not count against the rate limit itself.
 */
export async function getCoreRateLimit(token: string): Promise<CoreRateLimit> {
  const res = await fetch("https://api.github.com/rate_limit", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub rate limit request failed: ${res.status} ${res.statusText}`);
  }

  const { resources } = (await res.json()) as RateLimitResponse;
  const { remaining, reset } = resources.core;

  return { remaining, resetsAt: new Date(reset * 1000) };
}
