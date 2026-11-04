export interface CoreRateLimit {
  remaining: number;
  resetsAt: Date;
}

interface RateLimitResponse {
  resources: {
    core: {
      limit: number;
      remaining: number;
      used: number;
      reset: number; // UTC epoch seconds
    };
  };
}

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

  const { resources } = (await response.json()) as RateLimitResponse;

  return {
    remaining: resources.core.remaining,
    resetsAt: new Date(resources.core.reset * 1000),
  };
}
