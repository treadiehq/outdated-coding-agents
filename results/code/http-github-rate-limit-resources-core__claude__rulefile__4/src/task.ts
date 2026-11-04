export interface CoreRateLimit {
  /** Regular (non-search) REST requests left in the current window. */
  remaining: number;
  /** When the allowance resets. */
  resetsAt: Date;
}

interface RateLimitResponse {
  resources: {
    core: { limit: number; remaining: number; reset: number; used: number };
  };
}

/**
 * Reads GET /rate_limit (which doesn't count against the limit) and returns
 * the remaining "core" requests, i.e. regular non-search REST calls, and when they reset.
 */
export async function getCoreRateLimit(token: string): Promise<CoreRateLimit> {
  const res = await fetch("https://api.github.com/rate_limit", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10",
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub rate limit request failed: ${res.status} ${res.statusText}`);
  }

  const { resources } = (await res.json()) as RateLimitResponse;
  const { remaining, reset } = resources.core;

  // `reset` is a UTC epoch timestamp in seconds.
  return { remaining, resetsAt: new Date(reset * 1000) };
}
