export interface CoreRateLimit {
  remaining: number;
  resetsAt: Date;
}

interface RateLimitResponse {
  resources: {
    core: {
      limit: number;
      remaining: number;
      reset: number;
      used: number;
    };
  };
}

/**
 * Returns the token's remaining regular (non-search) REST API requests and when
 * that allowance resets. Calling this endpoint does not count against the limit.
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

  // Read resources.core: the top-level `rate` object is closing down.
  const { resources } = (await response.json()) as RateLimitResponse;
  const { remaining, reset } = resources.core;

  // `reset` is in UTC epoch seconds; Date expects milliseconds.
  return { remaining, resetsAt: new Date(reset * 1000) };
}
