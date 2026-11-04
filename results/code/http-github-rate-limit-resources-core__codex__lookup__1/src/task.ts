/** Returns the token's regular (non-search) REST API allowance. */
export async function getGitHubRateLimit(
  token: string,
): Promise<{ remaining: number; resetsAt: Date }> {
  if (!token.trim()) {
    throw new Error("A GitHub token is required.");
  }

  // https://docs.github.com/en/rest/rate-limit/rate-limit
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
    resources?: { core?: { remaining?: unknown; reset?: unknown } };
  } | null;
  // Use resources.core; GitHub has deprecated the top-level rate object.
  const core = data?.resources?.core;
  const remaining = core?.remaining;
  const reset = core?.reset;
  if (
    typeof remaining !== "number" ||
    !Number.isSafeInteger(remaining) ||
    remaining < 0 ||
    typeof reset !== "number" ||
    !Number.isSafeInteger(reset) ||
    reset < 0
  ) {
    throw new Error("GitHub returned invalid core rate limit data.");
  }

  // GitHub reports reset as Unix seconds; Date expects milliseconds.
  const resetsAt = new Date(reset * 1000);
  if (Number.isNaN(resetsAt.getTime())) {
    throw new Error("GitHub returned an invalid rate limit reset time.");
  }
  return { remaining, resetsAt };
}
