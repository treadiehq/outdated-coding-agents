interface RateLimit {
  limit: number;
  used: number;
  remaining: number;
  reset: number; // UTC epoch seconds
}

interface RateLimitResponse {
  resources: {
    core: RateLimit;
    search: RateLimit;
  };
}

export interface CoreRateLimit {
  remaining: number;
  resetsAt: Date;
}

/**
 * Returns the remaining core (non-search) REST requests for the token
 * and when that allowance resets. Calling /rate_limit does not count
 * against the limit.
 */
export async function getCoreRateLimit(token: string): Promise<CoreRateLimit> {
  const res = await fetch("https://api.github.com/rate_limit", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2026-03-10",
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub rate limit request failed: ${res.status} ${res.statusText}`);
  }

  // Use resources.core; the top-level `rate` object is being retired.
  const { resources } = (await res.json()) as RateLimitResponse;
  const { remaining, reset } = resources.core;

  return { remaining, resetsAt: new Date(reset * 1000) };
}
