/** Reads the token's non-search REST allowance from GitHub's rate limit JSON. */
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
      "User-Agent": "github-rate-limit-check",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub rate limit request failed (HTTP ${response.status}).`);
  }

  const data: unknown = await response.json();
  // https://docs.github.com/en/rest/rate-limit/rate-limit
  // Use resources.core; the old top-level rate object is deprecated.
  const core = (
    data as { resources?: { core?: { remaining?: unknown; reset?: unknown } } } | null
  )?.resources?.core;
  if (
    typeof core?.remaining !== "number" ||
    !Number.isSafeInteger(core.remaining) ||
    core.remaining < 0 ||
    typeof core.reset !== "number" ||
    !Number.isSafeInteger(core.reset) ||
    core.reset < 0
  ) {
    throw new Error("GitHub returned invalid resources.core rate limit data.");
  }

  // GitHub reset timestamps are Unix seconds; Date takes milliseconds.
  const resetsAt = new Date(core.reset * 1000);
  if (Number.isNaN(resetsAt.getTime())) {
    throw new Error("GitHub returned an invalid rate limit reset timestamp.");
  }

  return { remaining: core.remaining, resetsAt };
}
