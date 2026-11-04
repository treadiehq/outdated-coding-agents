/**
 * Shows Slack's native thinking indicator while an agent prepares a reply.
 * Call on the server with a granular bot token bearing `chat:write`; the app
 * must be a member of the channel. Keep threadTs as the root timestamp string.
 *
 * Current API: https://docs.slack.dev/reference/methods/agents.sessions.setStatus/
 * This replaces assistant.threads.setStatus. `processing` activates Slack's
 * loading UI; the displayed wording is controlled by Slack, not a custom
 * "Thinking..." status string. After replying (or if preparation fails), call
 * this function with thinking=false to return the agent to `active`.
 *
 * @example
 * await setThinkingStatus(botToken, channelId, threadTs);
 * try {
 *   // Prepare and post the reply in this thread.
 * } finally {
 *   await setThinkingStatus(botToken, channelId, threadTs, false);
 * }
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

  // Slack can return HTTP 200 for API errors, so also check the JSON envelope.
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
