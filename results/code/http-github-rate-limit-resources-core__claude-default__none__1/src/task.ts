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
      /** Unix epoch time in seconds. */
      reset: number;
    };
  };
}

/**
 * Returns how many regular (non-search) REST API requests the token has left
 * and when that allowance resets. Calling this endpoint does not itself count
 * against the limit.
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
      `GitHub rate limit request failed: ${response.status} ${await response.text()}`,
    );
  }

  const { resources } = (await response.json()) as RateLimitResponse;
  const { remaining, reset } = resources.core;

  return { remaining, resetsAt: new Date(reset * 1000) };
}
