interface RateLimitResource {
  limit: number;
  used: number;
  remaining: number;
  reset: number; // UTC epoch seconds
}

interface RateLimitResponse {
  resources: {
    core: RateLimitResource;
    search: RateLimitResource;
  };
}

export interface CoreRateLimit {
  remaining: number;
  resetsAt: Date;
}

/**
 * Returns how many regular (non-search) REST requests the token has left,
 * and when that allowance resets. Calls to /rate_limit don't count against the limit.
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

  // `resources.core` covers all non-search REST endpoints. The top-level
  // `rate` object is closing down, so it isn't used here.
  const { resources } = (await response.json()) as RateLimitResponse;
  const { remaining, reset } = resources.core;

  return { remaining, resetsAt: new Date(reset * 1000) };
}
