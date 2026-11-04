/**
 * Shows Slack's native thinking/loading indicator on an agent's thread.
 * Call with `thinking: false` after posting the reply, or if preparation fails.
 *
 * Requires a server-side granular bot token with `chat:write`, and the app
 * must be a member of the channel. Keep thread timestamps as strings.
 *
 * The current API uses `processing` rather than custom "Thinking..." text;
 * Slack controls the displayed wording. It replaces assistant.threads.setStatus.
 * @see https://docs.slack.dev/reference/methods/agents.sessions.setStatus/
 */
export async function setThinkingStatus(
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
    const retryAfter = response.headers.get("Retry-After");
    throw new Error(
      `Slack status request failed (HTTP ${response.status})` +
        (retryAfter ? `; retry after ${retryAfter} seconds` : ""),
    );
  }

  // Slack can report API errors even when the HTTP status is 200.
  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null || !("ok" in result)) {
    throw new Error("Slack returned an invalid status response.");
  }
  if (result.ok !== true) {
    const error =
      "error" in result && typeof result.error === "string"
        ? result.error
        : "unknown_error";
    throw new Error(`Slack agents.sessions.setStatus failed: ${error}`);
  }
}
