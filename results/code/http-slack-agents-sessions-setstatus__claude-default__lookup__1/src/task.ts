type SessionStatus = "processing" | "active";

async function setSessionStatus(
  token: string,
  channelId: string,
  threadTs: string,
  status: SessionStatus,
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

  // Slack reports most failures with HTTP 200 and `ok: false`.
  const data = (await response.json()) as { ok: boolean; error?: string };
  if (!data.ok) {
    throw new Error(`agents.sessions.setStatus failed: ${data.error ?? "unknown_error"}`);
  }
}

/**
 * Shows the agent's loading indicator on a thread while it prepares a reply.
 * Requires a granular bot token with the `chat:write` scope.
 *
 * Slack controls the indicator's text ("Working...") and this method does not
 * accept a custom message. The session times out after one hour; call this
 * again during longer work to restart the timer.
 */
export async function showThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  await setSessionStatus(token, channelId, threadTs, "processing");
}

/**
 * Clears the loading indicator. Call this once the reply has been posted,
 * including when preparing it fails: posting a message does not clear it.
 */
export async function clearThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  await setSessionStatus(token, channelId, threadTs, "active");
}
