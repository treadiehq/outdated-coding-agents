export interface GitHubRateLimit {
  remaining: number;
  resetsAt: Date;
}

/** Reads the token's core (non-search) REST API allowance. */
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
    throw new Error(`GitHub rate limit request failed: HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("resources" in data)) {
    throw new Error("Invalid GitHub rate limit response.");
  }
  const resources = data.resources;
  if (!resources || typeof resources !== "object" || !("core" in resources)) {
    throw new Error("Missing GitHub core rate limit.");
  }
  const core = resources.core;
  if (
    !core || typeof core !== "object" ||
    !("remaining" in core) || !("reset" in core) ||
    typeof core.remaining !== "number" ||
    !Number.isSafeInteger(core.remaining) || core.remaining < 0 ||
    typeof core.reset !== "number" || !Number.isFinite(core.reset)
  ) {
    throw new Error("Invalid GitHub core rate limit.");
  }

  // GitHub returns the reset time as Unix seconds; Date takes milliseconds.
  const resetsAt = new Date(core.reset * 1000);
  if (Number.isNaN(resetsAt.getTime())) {
    throw new Error("Invalid GitHub rate limit reset time.");
  }
  return { remaining: core.remaining, resetsAt };
}
