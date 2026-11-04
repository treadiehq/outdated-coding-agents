/**
 * Shows Slack's built-in loading indicator while the agent prepares a reply.
 * Slack displays "Working..."; this API does not support custom "Thinking..." text.
 * Pass thinking=false after posting the reply to mark the session active again.
 * Requires an agent app's bot token with assistant:write and chat:write scopes,
 * and membership in the target channel. Keep the token on the server.
 * https://docs.slack.dev/reference/methods/agents.sessions.setStatus/
 */
export async function setThinkingStatus(
  botToken: string,
  channelId: string,
  threadTs: string,
  thinking = true,
): Promise<void> {
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
    throw new Error(`Slack agents.sessions.setStatus HTTP ${response.status}`);
  }

  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null || !("ok" in result)) {
    throw new Error("Slack agents.sessions.setStatus returned an invalid response");
  }
  if (result.ok !== true) {
    const error = "error" in result && typeof result.error === "string"
      ? result.error
      : "unknown_error";
    throw new Error(`Slack agents.sessions.setStatus failed: ${error}`);
  }
}
