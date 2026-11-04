/**
 * Shows "Thinking..." in an AI assistant thread before preparing a reply.
 * Call and await this before starting the work that generates the reply.
 *
 * Requires a bot token with chat:write and Slack's AI agent experience enabled.
 * Slack clears the status when the app replies, or after two minutes.
 * This is a thread status, not the user's profile status or a posted message.
 *
 * https://docs.slack.dev/reference/methods/assistant.threads.setStatus/
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
    const retryAfter = response.headers.get("Retry-After");
    throw new Error(
      `Slack status request failed (HTTP ${response.status}).` +
        (response.status === 429 && retryAfter
          ? ` Retry after ${retryAfter} seconds.`
          : ""),
    );
  }

  // Slack can return HTTP 200 even when the API operation failed.
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
    throw new Error(`Slack could not set the thread status: ${error}`);
  }
}
