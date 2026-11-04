interface RateLimitBucket {
  limit: number;
  used: number;
  remaining: number;
  /** Unix epoch time in seconds. */
  reset: number;
}

interface RateLimitResponse {
  resources: {
    core: RateLimitBucket;
    search: RateLimitBucket;
    [resource: string]: RateLimitBucket;
  };
}

export interface CoreRateLimit {
  remaining: number;
  resetsAt: Date;
}

/**
 * Returns how many regular (non-search) REST requests the token has left,
 * and when that allowance resets. Uses the "core" bucket from GET /rate_limit,
 * which does not count against the rate limit itself.
 */
export async function getCoreRateLimit(token: string): Promise<CoreRateLimit> {
  const response = await fetch("https://api.github.com/rate_limit", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub rate limit request failed: ${response.status} ${response.statusText}`,
    );
  }

  const { resources } = (await response.json()) as RateLimitResponse;
  const { remaining, reset } = resources.core;

  return { remaining, resetsAt: new Date(reset * 1000) };
}
