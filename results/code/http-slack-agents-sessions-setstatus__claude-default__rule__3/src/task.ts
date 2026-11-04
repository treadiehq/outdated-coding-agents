type SlackResponse = {
  ok: boolean;
  error?: string;
};

/**
 * Shows the agent's loading indicator on a thread while it prepares a reply.
 *
 * Slack renders its own loading text for the `processing` status, because
 * agents.sessions.setStatus does not accept a custom message. The status stays
 * until the app changes it or it times out to `active` after one hour; posting
 * a reply does not clear it.
 *
 * @param token Bot token (xoxb-...) with the chat:write scope.
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
    throw new Error(`agents.sessions.setStatus failed with HTTP ${response.status}`);
  }

  const data = (await response.json()) as SlackResponse;
  if (!data.ok) {
    throw new Error(`agents.sessions.setStatus failed: ${data.error ?? "unknown_error"}`);
  }
}
