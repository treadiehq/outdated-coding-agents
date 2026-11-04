/**
 * Shows Slack's native thinking/loading indicator while the agent prepares a reply.
 * Call with `thinking: false` after posting the reply, or if preparation fails.
 *
 * Requires a granular bot token with `chat:write`, agent sessions enabled in the
 * workspace, and the app to be a member of the channel. Use server-side only.
 * Keep threadTs as the string timestamp of the thread's root message.
 *
 * Slack controls the indicator's wording; the current API does not accept a
 * literal "Thinking..." label. `processing` replaces the legacy free-text
 * assistant.threads.setStatus API; `active` clears this agent's loading state.
 * https://docs.slack.dev/reference/methods/agents.sessions.setStatus/
 *
 * @example
 * await setThinkingStatus(botToken, channelId, threadTs);
 * try {
 *   // Prepare and post the reply in this thread here.
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
      `Slack status request failed: HTTP ${response.status}` +
        (retryAfter ? ` (retry after ${retryAfter} seconds)` : ""),
    );
  }

  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null || !("ok" in result)) {
    throw new Error("Slack returned an invalid status response.");
  }
  if (result.ok !== true) {
    const error = "error" in result && typeof result.error === "string"
      ? result.error
      : "unknown_error";
    throw new Error(`Slack status request failed: ${error}`);
  }
}
