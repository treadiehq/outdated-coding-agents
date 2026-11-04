/** Returns the token's remaining regular REST requests and their reset time. */
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
    throw new Error(`GitHub rate limit request failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    resources: { core: { remaining: number; reset: number } };
  };

  // The core bucket covers non-search REST requests. Reset is Unix seconds.
  const { remaining, reset } = data.resources.core;
  return { remaining, resetsAt: new Date(reset * 1_000) };
}
