export interface GitHubRateLimit {
  remaining: number;
  resetsAt: Date;
}

/** Returns the authenticated token's regular (non-search) REST API allowance. */
export async function getGitHubRateLimit(token: string): Promise<GitHubRateLimit> {
  if (!token.trim()) {
    throw new Error("A GitHub token is required.");
  }

  const response = await fetch("https://api.github.com/rate_limit", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2026-03-10",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub rate limit request failed (HTTP ${response.status}).`);
  }

  const data = (await response.json()) as {
    resources: { core: { remaining: number; reset: number } };
  };

  return {
    remaining: data.resources.core.remaining,
    // GitHub reports reset as Unix seconds; Date expects milliseconds.
    resetsAt: new Date(data.resources.core.reset * 1000),
  };
}
