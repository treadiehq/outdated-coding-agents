/**
 * Shows a native "Thinking..." status in an AI assistant thread.
 * Call and await this before starting reply generation.
 *
 * Requires a bot token with chat:write and an app configured for Slack's
 * AI agent experience. Keep the token on the server.
 * Slack clears the status when the app replies, or after two minutes.
 * Pass an empty status to clear it explicitly (for example, on failure).
 *
 * https://docs.slack.dev/reference/methods/assistant.threads.setStatus/
 * This free-text endpoint remains supported through Slack's compatibility
 * bridge; agent sessions use agents.sessions.setStatus for lifecycle states.
 */
export async function setThinkingStatus(
  botToken: string,
  channelId: string,
  threadTs: string,
  status: string = "Thinking...",
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
        status,
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

  // Slack can report API errors even when the HTTP status is 200.
  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null || !("ok" in result)) {
    throw new Error("Slack returned an invalid status response");
  }
  if (result.ok !== true) {
    const error =
      "error" in result && typeof result.error === "string"
        ? result.error
        : "unknown_error";
    throw new Error(`Slack assistant.threads.setStatus failed: ${error}`);
  }
}
