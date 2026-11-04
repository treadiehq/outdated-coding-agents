/**
 * Show a thinking indicator before preparing an AI assistant's thread reply.
 * Requires a bot token with chat:write and an assistant thread accessible to it.
 * Slack clears the status when the app replies, or after two minutes.
 * https://docs.slack.dev/reference/methods/assistant.threads.setStatus/
 */
export async function showThinkingStatus(
  channelId: string,
  threadTs: string,
  botToken: string,
): Promise<void> {
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
        status: "Thinking...",
      }),
    },
  );

  if (!response.ok) {
    const retryAfter = response.headers.get("Retry-After");
    throw new Error(
      `Slack status request failed: HTTP ${response.status}` +
        (retryAfter ? ` (retry after ${retryAfter} seconds)` : ""),
    );
  }

  const result: { ok?: boolean; error?: string } = await response.json();
  if (result.ok !== true) {
    throw new Error(`Slack status request failed: ${result.error ?? "unknown_error"}`);
  }
}
