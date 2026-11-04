/**
 * Shows Slack's agent loading indicator for a thread while preparing a reply.
 * Requires a granular bot token with chat:write and channel membership.
 *
 * Slack's agents.sessions.setStatus accepts lifecycle states, not custom text:
 * processing displays Slack's "Working..." indicator, not literal "Thinking...".
 * https://docs.slack.dev/ai/agent-sessions/
 *
 * Call with thinking=true before preparing the reply, then thinking=false in a
 * finally block after sending it (or on failure). Posting does not clear it.
 * Keep threadTs as a string to preserve the timestamp's precision.
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

  const response = await fetch(
    "https://slack.com/api/agents.sessions.setStatus",
    {
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
    },
  );

  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    throw new Error(
      `Slack agents.sessions.setStatus failed: HTTP ${response.status}` +
        (response.status === 429 && retryAfter
          ? ` (retry after ${retryAfter} seconds)`
          : ""),
    );
  }

  // Slack can report an API failure even with HTTP 200.
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
