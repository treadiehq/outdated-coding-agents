/**
 * Shows a native status on an AI assistant thread before preparing a reply.
 * Call on your server with a bot token bearing the chat:write scope.
 * Slack prefixes the status with the app name and clears it when the app
 * replies, or after two minutes. Keep threadTs as a string for precision.
 *
 * @see https://docs.slack.dev/reference/methods/assistant.threads.setStatus/
 */
export async function showThinkingStatus(
  botToken: string,
  channelId: string,
  threadTs: string,
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
        status: "Thinking...",
      }),
    },
  );

  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    throw new Error(
      `Slack status request failed: HTTP ${response.status}` +
        (retryAfter ? ` (retry after ${retryAfter} seconds)` : ""),
    );
  }

  // Slack may report an API failure even when the HTTP status is 200.
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
        : "invalid_response";
    throw new Error(`Slack status request failed: ${error}`);
  }
}
