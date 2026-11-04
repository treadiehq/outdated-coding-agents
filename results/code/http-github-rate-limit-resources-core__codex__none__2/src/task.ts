export interface GitHubRateLimit {
  remaining: number;
  resetsAt: Date;
}

/** Returns the token's regular REST API allowance from resources.core. */
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

  const data: unknown = await response.json();
  const core = (data as {
    resources?: { core?: { remaining?: unknown; reset?: unknown } };
  } | null)?.resources?.core;

  if (
    typeof core?.remaining !== "number" ||
    !Number.isInteger(core.remaining) ||
    core.remaining < 0 ||
    typeof core.reset !== "number" ||
    !Number.isFinite(core.reset)
  ) {
    throw new Error("GitHub returned an invalid core rate limit response.");
  }

  // GitHub's reset timestamp is Unix seconds; Date expects milliseconds.
  const resetsAt = new Date(core.reset * 1000);
  if (Number.isNaN(resetsAt.getTime())) {
    throw new Error("GitHub returned an invalid rate limit reset timestamp.");
  }

  return { remaining: core.remaining, resetsAt };
}
