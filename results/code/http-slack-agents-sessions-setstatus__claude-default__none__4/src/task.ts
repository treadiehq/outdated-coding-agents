const SET_STATUS_URL = "https://slack.com/api/assistant.threads.setStatus";

/**
 * Shows "Thinking..." on a user's thread with the agent. Slack clears the
 * status when the app replies in the thread, or after two minutes otherwise.
 *
 * Uses the legacy method because its replacement, agents.sessions.setStatus,
 * does not accept custom status text.
 *
 * @param token Bot token with the chat:write scope.
 * @throws If the request fails or Slack returns an error.
 */
export async function setThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  const response = await fetch(SET_STATUS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel_id: channelId,
      thread_ts: threadTs,
      status: "Thinking...",
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const retryAfter = response.headers.get("Retry-After");
    throw new Error(
      `assistant.threads.setStatus failed: HTTP ${response.status}` +
        (retryAfter ? ` (retry after ${retryAfter}s)` : ""),
    );
  }

  // Slack reports most API errors with HTTP 200 and ok: false.
  const result: { ok: boolean; error?: string } = await response.json();
  if (!result.ok) {
    throw new Error(`assistant.threads.setStatus failed: ${result.error}`);
  }
}
