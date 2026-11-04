/**
 * Call before preparing a reply to show Slack's loading indicator in the thread.
 * Slack displays "Working...": agents.sessions.setStatus does not support custom
 * loading text such as "Thinking...". Call with status "active" after replying
 * (or when preparation fails) to end the loading state.
 *
 * Use a server-side bot token for an app configured as an agent, with the
 * assistant:write and chat:write scopes and membership in the channel.
 * https://docs.slack.dev/reference/methods/agents.sessions.setStatus/
 */
export async function setAgentThreadStatus(
  botToken: string,
  channelId: string,
  threadTs: string,
  status: "processing" | "active" = "processing",
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
      status,
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack status request failed: HTTP ${response.status}`);
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
