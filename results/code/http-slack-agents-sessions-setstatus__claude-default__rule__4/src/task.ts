const SET_STATUS_URL = "https://slack.com/api/agents.sessions.setStatus";

type AgentSessionStatus = "active" | "processing";

async function setAgentSessionStatus(
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
    throw new Error(
      `agents.sessions.setStatus failed with HTTP ${response.status}`,
    );
  }

  // Slack reports most API failures with HTTP 200 and `ok: false`.
  const result = (await response.json()) as { ok: boolean; error?: string };
  if (!result.ok) {
    throw new Error(`agents.sessions.setStatus failed: ${result.error}`);
  }
}

/**
 * Shows Slack's loading state on the thread while the agent prepares a reply.
 *
 * Requires a bot token with the `chat:write` scope. Slack renders its own
 * "Working..." text; this method does not accept a custom loading message.
 */
export async function showThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  await setAgentSessionStatus(token, channelId, threadTs, "processing");
}

/**
 * Clears the loading state. Call this once the reply is posted: posting a
 * message does not clear it, and it otherwise lasts until a one-hour timeout.
 */
export async function clearThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  await setAgentSessionStatus(token, channelId, threadTs, "active");
}
