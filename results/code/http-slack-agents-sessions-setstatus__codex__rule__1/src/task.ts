/**
 * Shows Slack's loading indicator while the agent prepares a reply.
 * Requires a bot token with chat:write and membership in the channel.
 *
 * Slack controls the displayed text (currently "Working..."); this API cannot
 * display custom "Thinking..." text. Call again with thinking=false after
 * posting the reply, or in a finally block on failure, to clear the indicator.
 * Posting a message does not automatically clear the processing state.
 *
 * Reference: https://docs.slack.dev/ai/agent-sessions/
 */
export async function setAgentThinkingStatus(
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
        (retryAfter ? ` (retry after ${retryAfter} seconds)` : ""),
    );
  }

  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null || !("ok" in result)) {
    throw new Error("Slack agents.sessions.setStatus returned an invalid response.");
  }
  if (result.ok !== true) {
    const error =
      "error" in result && typeof result.error === "string"
        ? result.error
        : "unknown_error";
    throw new Error(`Slack agents.sessions.setStatus failed: ${error}`);
  }
}
