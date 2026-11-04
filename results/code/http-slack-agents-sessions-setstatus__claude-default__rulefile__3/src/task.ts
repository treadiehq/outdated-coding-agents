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
    const retryAfter = response.headers.get("Retry-After");
    throw new Error(
      `agents.sessions.setStatus returned HTTP ${response.status}` +
        (retryAfter ? ` (retry after ${retryAfter}s)` : ""),
    );
  }

  // Slack reports most failures with HTTP 200 and `ok: false`.
  const result = (await response.json()) as { ok: boolean; error?: string };
  if (!result.ok) {
    throw new Error(`agents.sessions.setStatus failed: ${result.error}`);
  }
}

/**
 * Shows Slack's loading indicator on the thread while the agent prepares a reply.
 *
 * Slack picks the indicator text ("Working...") because this method does not
 * accept a custom loading message. Requires a bot token with `chat:write`, and
 * the app must be a member of the channel.
 *
 * @param threadTs Timestamp of the thread's root message.
 */
export function showThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setSessionStatus(token, channelId, threadTs, "processing");
}

/**
 * Clears the loading indicator. Call this once the reply has been posted:
 * posting a message does not clear it, so it would otherwise stay up until
 * Slack's one-hour timeout.
 */
export function clearThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setSessionStatus(token, channelId, threadTs, "active");
}
