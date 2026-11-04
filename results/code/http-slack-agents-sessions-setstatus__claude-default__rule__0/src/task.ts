const SET_STATUS_URL = "https://slack.com/api/agents.sessions.setStatus";

type SessionStatus = "active" | "processing" | "suspended" | "closed";

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

  if (!response.ok) {
    throw new Error(`agents.sessions.setStatus failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as { ok: boolean; error?: string };
  if (!data.ok) {
    throw new Error(`agents.sessions.setStatus failed: ${data.error ?? "unknown_error"}`);
  }
}

/**
 * Shows Slack's loading indicator on the thread while the agent prepares a reply.
 * The token must be a bot token with the chat:write scope.
 *
 * Slack renders its own "Working..." label: this method does not accept custom text.
 */
export function showThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setSessionStatus(token, channelId, threadTs, "processing");
}

/**
 * Clears the loading indicator. Call this after posting the reply, including when
 * preparing it fails; otherwise the indicator stays for up to an hour.
 */
export function clearThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setSessionStatus(token, channelId, threadTs, "active");
}
