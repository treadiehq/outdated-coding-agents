/**
 * Shows the agent's loading indicator on a thread while it prepares a reply.
 *
 * agents.sessions.setStatus takes a lifecycle state rather than display text, so
 * Slack renders its own loading label for `processing`. The session stays in
 * this state until the app sets it to `active` or it times out after one hour.
 *
 * @param token Bot token with the `chat:write` scope.
 * @param channelId ID of the channel containing the thread.
 * @param threadTs Timestamp of the thread's root message.
 */
export async function showThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  const response = await fetch("https://slack.com/api/agents.sessions.setStatus", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel_id: channelId,
      thread_ts: threadTs,
      status: "processing",
    }),
  });

  if (!response.ok) {
    throw new Error(`agents.sessions.setStatus failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as { ok: boolean; error?: string };
  if (!data.ok) {
    throw new Error(`agents.sessions.setStatus failed: ${data.error ?? "unknown_error"}`);
  }
}
