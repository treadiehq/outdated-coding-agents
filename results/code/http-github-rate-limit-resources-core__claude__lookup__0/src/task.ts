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
 * Returns how many regular (non-search) REST requests the token has left
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

  const body = (await res.json()) as RateLimitResponse;
  // Use resources.core; the top-level `rate` object is being retired.
  const { remaining, reset } = body.resources.core;

  return { remaining, resetsAt: new Date(reset * 1000) };
}
