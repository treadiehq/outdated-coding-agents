/**
 * Shows Slack's native loading indicator while an agent prepares a thread reply.
 * Call with `thinking: false` after posting the reply, or if preparation fails.
 *
 * Requires a server-side granular bot token with chat:write, an app declared as
 * an agent, and app membership in the channel. Keep threadTs as a string.
 *
 * Slack's current API renders "Working..."; custom "Thinking..." text is no
 * longer supported. agents.sessions.setStatus replaces assistant.threads.setStatus.
 * Posting a regular reply does not automatically clear this session status.
 *
 * @see https://docs.slack.dev/reference/methods/agents.sessions.setStatus/
 * @see https://docs.slack.dev/ai/agent-sessions/
 */
export async function setThreadThinkingStatus(
  channelId: string,
  threadTs: string,
  botToken: string,
  thinking = true,
): Promise<void> {
  if (!channelId.trim() || !threadTs.trim() || !botToken.trim()) {
    throw new Error("channelId, threadTs, and botToken are required.");
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
    const retryAfter = response.headers.get("Retry-After");
    throw new Error(
      `Slack agents.sessions.setStatus failed (HTTP ${response.status})` +
        (response.status === 429 && retryAfter
          ? `; retry after ${retryAfter} seconds.`
          : "."),
    );
  }

  // Slack can report API errors even when the HTTP response is successful.
  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null || !("ok" in result)) {
    throw new Error("Slack returned an invalid API response.");
  }
  if (result.ok !== true) {
    const error =
      "error" in result && typeof result.error === "string"
        ? result.error
        : "unknown_error";
    throw new Error(`Slack agents.sessions.setStatus failed: ${error}`);
  }
}
