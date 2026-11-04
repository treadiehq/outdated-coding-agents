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
    body: JSON.stringify({ channel_id: channelId, thread_ts: threadTs, status }),
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    throw new Error(`Slack agents.sessions.setStatus rate limited; retry after ${retryAfter}s`);
  }
  if (!response.ok) {
    throw new Error(`Slack agents.sessions.setStatus failed with HTTP ${response.status}`);
  }

  // Slack reports most failures with HTTP 200 and `ok: false`.
  const body = (await response.json()) as { ok: boolean; error?: string };
  if (!body.ok) {
    throw new Error(`Slack agents.sessions.setStatus failed: ${body.error ?? "unknown_error"}`);
  }
}

/**
 * Shows Slack's loading indicator on a thread while the agent prepares a reply.
 *
 * The session API doesn't accept custom text, so Slack renders its own
 * "Working..." label. Requires a bot token with `chat:write`.
 */
export function showThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setSessionStatus(token, channelId, threadTs, "processing");
}

/**
 * Clears the indicator. Posting a reply doesn't clear it, so call this when the
 * agent finishes; otherwise it stays up until Slack's one-hour timeout.
 */
export function clearThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setSessionStatus(token, channelId, threadTs, "active");
}
