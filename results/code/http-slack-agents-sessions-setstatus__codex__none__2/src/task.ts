/**
 * Shows a native status while your Slack AI agent prepares a thread reply.
 * Call and await this before generating the reply, using a bot token with
 * chat:write. Keep the token on the server.
 *
 * Slack clears the status when the app replies or after two minutes.
 * This thread-status endpoint remains supported via Slack's compatibility
 * bridge; new agent session integrations can use agents.sessions.setStatus.
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

  // Slack can report an API error even when the HTTP status is 200.
  const result: { ok?: boolean; error?: string } = await response.json();
  if (result.ok !== true) {
    throw new Error(`Slack status request failed: ${result.error ?? "unknown_error"}`);
  }
}
