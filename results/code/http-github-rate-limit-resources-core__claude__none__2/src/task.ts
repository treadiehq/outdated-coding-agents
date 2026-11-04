export interface RateLimitStatus {
  remaining: number;
  resetsAt: Date;
}

interface RateLimitResponse {
  resources: {
    core: {
      limit: number;
      remaining: number;
      reset: number; // UTC epoch seconds
      used: number;
    };
  };
}

/**
 * Returns how many core (non-search) REST requests the token has left
 * and when that allowance resets.
 */
export async function getCoreRateLimit(token: string): Promise<RateLimitStatus> {
  const res = await fetch("https://api.github.com/rate_limit", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "rate-limit-check",
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub rate limit request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as RateLimitResponse;
  const core = data.resources.core;

  return {
    remaining: core.remaining,
    resetsAt: new Date(core.reset * 1000),
  };
}
