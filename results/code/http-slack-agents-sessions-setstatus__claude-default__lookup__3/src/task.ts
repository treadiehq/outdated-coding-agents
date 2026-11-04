type AgentSessionStatus = "active" | "processing";

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

  // Slack reports most API errors with HTTP 200 and `ok: false`.
  const data = (await response.json()) as { ok: boolean; error?: string };
  if (!data.ok) {
    throw new Error(`agents.sessions.setStatus failed: ${data.error ?? "unknown_error"}`);
  }
}

/**
 * Shows Slack's loading indicator on an agent thread. This method takes a
 * lifecycle state rather than custom text, so Slack controls the wording.
 * Requires a bot token with the `chat:write` scope. `threadTs` must be the
 * thread's root message timestamp.
 */
export function showThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setAgentSessionStatus(token, channelId, threadTs, "processing");
}

/**
 * Clears the loading indicator. Call this after posting the reply: posting
 * doesn't clear it, and it otherwise lasts until the one-hour timeout.
 */
export function clearThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setAgentSessionStatus(token, channelId, threadTs, "active");
}
