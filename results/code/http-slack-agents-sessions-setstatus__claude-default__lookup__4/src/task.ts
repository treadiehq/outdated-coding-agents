const SET_STATUS_URL = "https://slack.com/api/agents.sessions.setStatus";

type AgentSessionStatus = "active" | "processing" | "suspended" | "closed";

async function setSessionStatus(
  token: string,
  channelId: string,
  threadTs: string,
  status: AgentSessionStatus,
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

  const data = (await response.json()) as { ok: boolean; error?: string };
  if (!data.ok) {
    throw new Error(`agents.sessions.setStatus failed: ${data.error}`);
  }
}

/**
 * Shows Slack's loading indicator on the thread while the agent prepares a reply.
 * The indicator's text is set by Slack; this method does not accept custom text.
 */
export async function showThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  await setSessionStatus(token, channelId, threadTs, "processing");
}

/**
 * Clears the loading indicator. Call this after posting the reply: posting a
 * message does not clear it, and it otherwise lasts until a one-hour timeout.
 */
export async function clearThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  await setSessionStatus(token, channelId, threadTs, "active");
}
