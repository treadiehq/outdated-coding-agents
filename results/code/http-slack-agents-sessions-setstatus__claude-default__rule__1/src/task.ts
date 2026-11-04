type AgentSessionStatus = "active" | "processing" | "suspended" | "closed";

async function setAgentSessionStatus(
  token: string,
  channelId: string,
  threadTs: string,
  status: AgentSessionStatus,
): Promise<void> {
  const response = await fetch(
    "https://slack.com/api/agents.sessions.setStatus",
    {
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
    },
  );

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    throw new Error(`Slack rate limited this request; retry after ${retryAfter}s`);
  }
  if (!response.ok) {
    throw new Error(`Slack returned HTTP ${response.status}`);
  }

  const data = (await response.json()) as { ok: boolean; error?: string };
  if (!data.ok) {
    throw new Error(`agents.sessions.setStatus failed: ${data.error}`);
  }
}

/**
 * Shows the loading indicator on a user's thread with the agent.
 *
 * Slack controls the indicator's wording ("Working..."); this method does not
 * accept custom text.
 */
export function showThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setAgentSessionStatus(token, channelId, threadTs, "processing");
}

/**
 * Clears the loading indicator. Call this once the reply is posted: posting a
 * message does not clear it, and it otherwise lasts until a one-hour timeout.
 */
export function clearThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setAgentSessionStatus(token, channelId, threadTs, "active");
}
