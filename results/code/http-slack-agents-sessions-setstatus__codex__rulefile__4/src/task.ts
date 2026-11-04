/**
 * Shows Slack's thinking/loading indicator while an agent prepares a reply.
 * Call with `thinking: false` after sending the reply (also on failure).
 *
 * Requires a server-side granular bot token with `chat:write`, an app that
 * supports agent sessions, and membership in the supplied channel.
 * Keep threadTs as a string to preserve the timestamp's precision.
 *
 * Slack controls the indicator's wording. The current API uses `processing`,
 * rather than accepting a literal "Thinking..." status string.
 * https://docs.slack.dev/reference/methods/agents.sessions.setStatus/
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
      `Slack status request failed: HTTP ${response.status}` +
        (retryAfter ? `; retry after ${retryAfter} seconds` : ""),
    );
  }

  const result: unknown = await response.json();
  if (
    typeof result !== "object" ||
    result === null ||
    !("ok" in result) ||
    result.ok !== true
  ) {
    const error =
      typeof result === "object" &&
      result !== null &&
      "error" in result &&
      typeof result.error === "string"
        ? result.error
        : "invalid API response";
    throw new Error(`Slack status request failed: ${error}`);
  }
}
