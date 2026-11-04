export interface GitHubRateLimit {
  remaining: number;
  resetsAt: Date;
}

/** Read the token's regular (non-search) REST API allowance. */
export async function getGitHubRateLimit(token: string): Promise<GitHubRateLimit> {
  if (!token.trim()) {
    throw new Error("A GitHub token is required.");
  }

  const response = await fetch("https://api.github.com/rate_limit", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub rate limit request failed (HTTP ${response.status}).`);
  }

  const data = (await response.json()) as {
    resources?: { core?: { remaining?: number; reset?: number } };
  } | null;
  // Use the JSON core bucket: search requests have a separate allowance.
  const core = data?.resources?.core;
  if (
    !core ||
    typeof core.remaining !== "number" ||
    !Number.isSafeInteger(core.remaining) ||
    core.remaining < 0 ||
    typeof core.reset !== "number" ||
    !Number.isSafeInteger(core.reset) ||
    core.reset < 0
  ) {
    throw new Error("GitHub returned an invalid core rate limit response.");
  }

  // GitHub reports reset as Unix seconds; Date expects milliseconds.
  const resetsAt = new Date(core.reset * 1000);
  if (Number.isNaN(resetsAt.getTime())) {
    throw new Error("GitHub returned an invalid rate limit reset time.");
  }

  return { remaining: core.remaining, resetsAt };
}
