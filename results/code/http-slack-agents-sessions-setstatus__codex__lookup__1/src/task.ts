/**
 * Show or clear Slack's native agent loading indicator for a thread.
 *
 * Requires a server-side granular bot token with chat:write, an app declared
 * as an agent, and membership in the channel. Uses the current API:
 * https://docs.slack.dev/reference/methods/agents.sessions.setStatus/
 *
 * Slack controls the indicator text (currently "Working..."); this API does
 * not accept custom "Thinking..." text. It replaces assistant.threads.setStatus.
 *
 * Call with thinking=true before preparing a reply, then thinking=false in a
 * finally block after posting the reply or handling a failure. Posting a regular
 * message does not automatically reset the session status.
 */
export async function setSlackThinking(
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
    const retryAfter = response.headers.get("retry-after");
    throw new Error(
      `Slack status request failed: HTTP ${response.status}` +
        (response.status === 429 && retryAfter
          ? ` (retry after ${retryAfter} seconds)`
          : ""),
    );
  }

  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null || !("ok" in result)) {
    throw new Error("Slack returned an invalid status response.");
  }
  // Slack can report API errors even when the HTTP status is 200.
  if (result.ok !== true) {
    const error =
      "error" in result && typeof result.error === "string"
        ? result.error
        : "unknown_error";
    throw new Error(`Slack status request failed: ${error}`);
  }
}
