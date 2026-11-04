/**
 * Show "Thinking..." in an AI assistant thread before preparing a reply.
 * Run on the server with a bot token bearing chat:write, using native fetch
 * (Node.js 18+). Keep threadTs as a string to preserve timestamp precision.
 *
 * Slack prefixes the status with the app name and clears it when the app
 * replies, or after two minutes. Pass "" as status to clear it on failure.
 *
 * Slack recommends agents.sessions.setStatus for new session integrations,
 * but that API accepts lifecycle enums, not custom "Thinking..." text.
 * This supported compatibility method provides the requested custom text:
 * https://docs.slack.dev/reference/methods/assistant.threads.setStatus/
 *
 * Usage: await setThinkingStatus(botToken, channelId, threadTs);
 * Then prepare and post the reply to the same thread.
 */
export async function setThinkingStatus(
  botToken: string,
  channelId: string,
  threadTs: string,
  status: string = "Thinking...",
): Promise<void> {
  if (!botToken.trim() || !channelId.trim() || !threadTs.trim()) {
    throw new Error("botToken, channelId, and threadTs are required.");
  }

  const response = await fetch(
    "https://slack.com/api/assistant.threads.setStatus",
    {
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
    },
  );

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
  if (result.ok !== true) {
    const error =
      "error" in result && typeof result.error === "string"
        ? result.error
        : "unknown_error";
    throw new Error(`Slack status request failed: ${error}`);
  }
}
