type AgentSessionStatus = "active" | "processing" | "suspended" | "closed";

async function setAgentSessionStatus(
  token: string,
  channelId: string,
  threadTs: string,
  status: AgentSessionStatus,
): Promise<void> {
  const response = await fetch("https://slack.com/api/agents.sessions.setStatus", {
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
 * Slack controls the indicator's text: this method does not accept custom wording.
 */
export function showThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setAgentSessionStatus(token, channelId, threadTs, "processing");
}

/**
 * Ends the loading indicator. Call this after posting the reply: posting does not
 * clear it, and it otherwise stays up until Slack's one-hour timeout.
 */
export function clearThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setAgentSessionStatus(token, channelId, threadTs, "active");
}
