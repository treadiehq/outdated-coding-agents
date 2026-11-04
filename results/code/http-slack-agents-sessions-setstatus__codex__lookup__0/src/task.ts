/**
 * Shows Slack's native loading indicator while the agent prepares a reply.
 * Call with `thinking: false` after posting the reply (or when work stops).
 *
 * Requires a granular bot token with chat:write, an app declared as an agent,
 * and app membership in the conversation. Keep the token on the server.
 *
 * Current API: https://docs.slack.dev/reference/methods/agents.sessions.setStatus/
 * This replaces assistant.threads.setStatus. Slack displays "Working...";
 * custom loading text such as "Thinking..." is no longer supported.
 */
export async function setAgentThinking(
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
      `Slack status request failed (HTTP ${response.status}).` +
        (response.status === 429 && retryAfter
          ? ` Retry after ${retryAfter} seconds.`
          : ""),
    );
  }

  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null || !("ok" in result)) {
    throw new Error("Slack returned an invalid status response.");
  }
  if (result.ok !== true) {
    const error =
      "error" in result && typeof result.error === "string"
        ? result.error
        : "unknown_error";
    throw new Error(`Slack status request failed: ${error}`);
  }
}
