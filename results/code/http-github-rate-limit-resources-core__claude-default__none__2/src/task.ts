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
      reset: number; // Unix epoch seconds
    };
  };
}

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

  // Read resources.core: the top-level `rate` field is deprecated.
  const { resources } = (await response.json()) as RateLimitResponse;

  return {
    remaining: resources.core.remaining,
    resetsAt: new Date(resources.core.reset * 1000),
  };
}
