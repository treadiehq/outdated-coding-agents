export interface CoreRateLimit {
  remaining: number;
  resetsAt: Date;
}

interface RateLimitResponse {
  resources: {
    core: {
      limit: number;
      used: number;
      remaining: number;
      /** UTC epoch seconds. */
      reset: number;
    };
  };
}

/**
 * Returns the token's remaining core REST API allowance (the bucket for
 * regular, non-search requests) and when it resets. Calling this endpoint does
 * not itself count against the limit.
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
      `GitHub rate limit request failed: ${response.status} ${await response.text()}`,
    );
  }

  const { resources } = (await response.json()) as RateLimitResponse;
  const { remaining, reset } = resources.core;

  return { remaining, resetsAt: new Date(reset * 1000) };
}
