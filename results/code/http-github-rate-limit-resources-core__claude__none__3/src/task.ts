interface RateLimitResource {
  limit: number;
  remaining: number;
  used: number;
  reset: number; // UTC epoch seconds
}

interface RateLimitResponse {
  resources: {
    core: RateLimitResource;
    search: RateLimitResource;
    [key: string]: RateLimitResource;
  };
  rate: RateLimitResource;
}

export interface CoreRateLimit {
  remaining: number;
  resetsAt: Date;
}

/**
 * Returns the remaining regular (core, non-search) REST requests for the
 * given token and when that allowance resets.
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
    throw new Error(`GitHub rate_limit request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as RateLimitResponse;
  const core = data.resources.core;

  return {
    remaining: core.remaining,
    resetsAt: new Date(core.reset * 1000),
  };
}
