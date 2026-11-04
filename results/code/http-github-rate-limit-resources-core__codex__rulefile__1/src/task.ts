/** Returns the token's regular REST API allowance from GitHub's JSON response. */
export async function getGitHubRateLimit(
  token: string,
): Promise<{ remaining: number; resetsAt: Date }> {
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
    !Number.isSafeInteger(core.remaining) ||
    core.remaining < 0 ||
    typeof core.reset !== "number" ||
    !Number.isSafeInteger(core.reset) ||
    core.reset < 0
  ) {
    throw new Error("GitHub returned an invalid resources.core rate limit.");
  }

  // resources.core covers non-search requests; reset is Unix time in seconds.
  const resetsAt = new Date(core.reset * 1_000);
  if (Number.isNaN(resetsAt.getTime())) {
    throw new Error("GitHub returned an invalid rate limit reset time.");
  }

  return { remaining: core.remaining, resetsAt };
}
