interface RateLimitCategory {
  limit: number;
  remaining: number;
  reset: number; // UTC epoch seconds
  used: number;
}

interface RateLimitResponse {
  resources: {
    core: RateLimitCategory;
    search: RateLimitCategory;
  };
}

export interface CoreRateLimit {
  remaining: number;
  resetsAt: Date;
}

/**
 * Returns the remaining regular (non-search) REST requests for the token
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

  const data = (await res.json()) as RateLimitResponse;
  // `resources.core` covers all non-search REST resources. The top-level
  // `rate` object is deprecated, so it is not used.
  const { remaining, reset } = data.resources.core;

  return { remaining, resetsAt: new Date(reset * 1000) };
}
