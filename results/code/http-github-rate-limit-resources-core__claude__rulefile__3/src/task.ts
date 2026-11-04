export interface CoreRateLimit {
  /** Requests left in the current window for regular (non-search) REST calls. */
  remaining: number;
  /** When the allowance resets. */
  resetsAt: Date;
}

interface RateLimitResponse {
  resources: {
    core: {
      limit: number;
      remaining: number;
      used: number;
      /** UTC epoch seconds */
      reset: number;
    };
  };
}

/**
 * Reads GitHub's `GET /rate_limit` endpoint and returns the remaining
 * core (regular, non-search) requests and when that allowance resets.
 * Calling this endpoint does not count against the rate limit.
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
