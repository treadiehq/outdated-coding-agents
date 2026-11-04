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
  const result = (await response.json()) as { ok: boolean; error?: string };
  if (!result.ok) {
    throw new Error(`agents.sessions.setStatus failed: ${result.error ?? "unknown_error"}`);
  }
}

/**
 * Shows Slack's loading state on the thread while the agent prepares a reply.
 *
 * Slack controls the label: this method does not accept custom loading text.
 * Requires a bot token with `chat:write`, and only call this if the agent will reply in the thread.
 */
export function showThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setSessionStatus(token, channelId, threadTs, "processing");
}

/**
 * Clears the loading state. Call this after posting the reply: posting does not clear it,
 * so the thread otherwise stays in `processing` until Slack's one-hour timeout.
 */
export function clearThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setSessionStatus(token, channelId, threadTs, "active");
}
