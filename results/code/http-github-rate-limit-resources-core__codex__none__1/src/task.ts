/** The remaining regular REST requests and the time their allowance resets. */
export interface GitHubRateLimit {
  remaining: number;
  resetsAt: Date;
}

/** Reads resources.core, GitHub's allowance for non-search REST requests. */
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
    resources?: { core?: { remaining?: number; reset?: number } };
  };
  const core = data?.resources?.core;
  const remaining = core?.remaining;
  const reset = core?.reset;
  if (
    typeof remaining !== "number" ||
    !Number.isInteger(remaining) ||
    remaining < 0 ||
    typeof reset !== "number" ||
    !Number.isInteger(reset) ||
    reset < 0
  ) {
    throw new Error("GitHub returned an invalid core rate limit.");
  }

  // GitHub's reset timestamp is in Unix seconds; Date expects milliseconds.
  return {
    remaining,
    resetsAt: new Date(reset * 1000),
  };
}
