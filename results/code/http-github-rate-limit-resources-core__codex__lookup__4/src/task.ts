/** The token's regular (non-search) REST API allowance. */
export interface GitHubRateLimit {
  remaining: number;
  resetsAt: Date;
}

/** Requires a runtime with native fetch, such as Node.js 18 or newer. */
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

  // GitHub's deprecated top-level `rate` field is replaced by resources.core.
  const data = (await response.json()) as {
    resources?: { core?: { remaining?: unknown; reset?: unknown } };
  } | null;
  const core = data?.resources?.core;
  if (
    typeof core?.remaining !== "number" ||
    !Number.isSafeInteger(core.remaining) ||
    core.remaining < 0 ||
    typeof core.reset !== "number" ||
    !Number.isSafeInteger(core.reset) ||
    core.reset < 0
  ) {
    throw new Error("GitHub returned an invalid core rate limit.");
  }

  // GitHub reports reset time in Unix seconds; Date takes milliseconds.
  const resetsAt = new Date(core.reset * 1000);
  if (Number.isNaN(resetsAt.getTime())) {
    throw new Error("GitHub returned an invalid rate limit reset time.");
  }

  return { remaining: core.remaining, resetsAt };
}
