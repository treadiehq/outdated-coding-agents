/**
 * Shows Slack's native loading indicator while an agent prepares its reply.
 * Slack renders this as "Working..."; this API cannot display custom
 * "Thinking..." text. Pass `false` after posting the reply (or on failure).
 *
 * Requires a granular bot token with chat:write, an app declared as an agent,
 * and membership in the channel. Keep the token on your server.
 * https://docs.slack.dev/reference/methods/agents.sessions.setStatus/
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
    throw new Error(
      `Slack agents.sessions.setStatus failed: HTTP ${response.status}`,
    );
  }

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
