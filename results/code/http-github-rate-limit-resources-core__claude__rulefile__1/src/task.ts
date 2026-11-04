interface RateLimitResource {
  limit: number;
  used: number;
  remaining: number;
  /** UTC epoch seconds when the window resets. */
  reset: number;
}

interface RateLimitResponse {
  resources: {
    core: RateLimitResource;
    search: RateLimitResource;
    [resource: string]: RateLimitResource;
  };
}

export interface CoreRateLimit {
  remaining: number;
  resetsAt: Date;
}

/**
 * Returns the remaining "core" (regular, non-search) REST requests for the
 * given token, and when that allowance resets.
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
