const SET_STATUS_URL = "https://slack.com/api/agents.sessions.setStatus";

type SessionStatus = "processing" | "active";

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
      `agents.sessions.setStatus failed with HTTP ${response.status}` +
        (retryAfter ? ` (retry after ${retryAfter}s)` : ""),
    );
  }

  // Slack reports most API errors as HTTP 200 with `ok: false`.
  const result = (await response.json()) as { ok: boolean; error?: string };
  if (!result.ok) {
    throw new Error(`agents.sessions.setStatus failed: ${result.error}`);
  }
}

/**
 * Shows Slack's loading indicator on the thread while the agent prepares a reply.
 * Requires a bot token with the `chat:write` scope.
 */
export function showThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setSessionStatus(token, channelId, threadTs, "processing");
}

/**
 * Clears the loading indicator. Posting a reply does not clear it, so call this
 * once the reply is sent; otherwise it stays up until Slack's one-hour timeout.
 */
export function clearThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setSessionStatus(token, channelId, threadTs, "active");
}
