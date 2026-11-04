/** Reads the token's regular (non-search) REST API allowance. */
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
      "User-Agent": "github-rate-limit-client",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub rate limit request failed (HTTP ${response.status}).`);
  }

  // https://docs.github.com/en/rest/rate-limit/rate-limit
  // Use resources.core; the legacy top-level rate object is being retired.
  const data = (await response.json()) as {
    resources?: { core?: { remaining?: number; reset?: number } };
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

  // GitHub supplies a Unix timestamp in seconds; Date takes milliseconds.
  const resetsAt = new Date(core.reset * 1000);
  if (Number.isNaN(resetsAt.getTime())) {
    throw new Error("GitHub returned an invalid rate limit reset time.");
  }
  return { remaining: core.remaining, resetsAt };
}
