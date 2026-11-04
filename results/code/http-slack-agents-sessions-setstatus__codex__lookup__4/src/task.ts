/**
 * Shows Slack's native loading indicator while an agent prepares a thread reply.
 * Run server-side with a granular bot token with chat:write; the app must be
 * declared as an agent and be a member of the channel. Requires native fetch.
 *
 * Slack's current API displays "Working...", not custom "Thinking..." text.
 * It replaces assistant.threads.setStatus and accepts lifecycle statuses only.
 * https://docs.slack.dev/ai/agent-sessions/
 * https://docs.slack.dev/reference/methods/agents.sessions.setStatus/
 *
 * Await this before preparing the reply. After posting the reply (or on failure),
 * call it again with thinking=false to return the agent to the active state.
 * Keep threadTs as a string to preserve the timestamp's precision.
 */
export async function setThreadThinking(
  botToken: string,
  channelId: string,
  threadTs: string,
  thinking = true,
): Promise<void> {
  if (!botToken.trim() || !channelId.trim() || !threadTs.trim()) {
    throw new Error("botToken, channelId, and threadTs are required.");
  }

  const response = await fetch("https://slack.com/api/agents.sessions.setStatus", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel_id: channelId,
      thread_ts: threadTs,
      status: thinking ? "processing" : "active",
    }),
  });

  if (!response.ok) {
    const retryAfter = response.headers.get("Retry-After");
    throw new Error(
      `Slack agents.sessions.setStatus failed: HTTP ${response.status}` +
        (response.status === 429 && retryAfter
          ? `; retry after ${retryAfter} seconds`
          : ""),
    );
  }

  // Slack can return HTTP 200 for API-level failures.
  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null || !("ok" in result)) {
    throw new Error("Slack agents.sessions.setStatus returned an invalid response.");
  }
  if (result.ok !== true) {
    const error = "error" in result && typeof result.error === "string"
      ? result.error
      : "unknown_error";
    throw new Error(`Slack agents.sessions.setStatus failed: ${error}`);
  }
}
