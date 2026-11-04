const SET_STATUS_URL = "https://slack.com/api/assistant.threads.setStatus";

/**
 * Shows "Thinking..." on an assistant thread while the agent prepares a reply.
 * Slack clears the status when the app replies in the thread, or after two
 * minutes if no reply is sent.
 *
 * @param token Bot token with the `chat:write` scope.
 * @param channelId ID of the channel containing the thread.
 * @param threadTs Timestamp of the thread.
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
  });

  if (!response.ok) {
    throw new Error(`Slack setStatus request failed: HTTP ${response.status}`);
  }

  // Slack reports API errors in the body of an HTTP 200 response.
  const result = (await response.json()) as { ok: boolean; error?: string };
  if (!result.ok) {
    throw new Error(`Slack setStatus request failed: ${result.error ?? "unknown_error"}`);
  }
}
