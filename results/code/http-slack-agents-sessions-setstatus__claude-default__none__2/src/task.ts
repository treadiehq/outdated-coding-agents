const SET_STATUS_URL = "https://slack.com/api/agents.sessions.setStatus";

type SessionStatus = "active" | "processing";

async function setSessionStatus(
  token: string,
  channelId: string,
  threadTs: string,
  status: SessionStatus,
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
      status,
    }),
  });

  if (!response.ok) {
    throw new Error(`agents.sessions.setStatus failed: HTTP ${response.status}`);
  }

  // Slack reports most failures with HTTP 200 and `ok: false`.
  const data = (await response.json()) as { ok: boolean; error?: string };
  if (!data.ok) {
    throw new Error(`agents.sessions.setStatus failed: ${data.error ?? "unknown_error"}`);
  }
}

/**
 * Shows Slack's loading indicator on the thread while the agent prepares a reply.
 * Only call this if the agent will reply in the thread. The token must be a bot
 * token with the `chat:write` scope, and the app must be a member of the channel.
 */
export async function showThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  await setSessionStatus(token, channelId, threadTs, "processing");
}

/**
 * Removes the loading indicator. Posting a reply does not remove it, so call this
 * when the agent is done; otherwise it stays until Slack's one-hour timeout.
 */
export async function clearThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  await setSessionStatus(token, channelId, threadTs, "active");
}
