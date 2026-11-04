type SessionStatus = "processing" | "active";

async function setSessionStatus(
  token: string,
  channelId: string,
  threadTs: string,
  status: SessionStatus,
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

  if (!response.ok) {
    throw new Error(`agents.sessions.setStatus: HTTP ${response.status}`);
  }

  const result = (await response.json()) as { ok: boolean; error?: string };
  if (!result.ok) {
    throw new Error(`agents.sessions.setStatus: ${result.error ?? "unknown_error"}`);
  }
}

/**
 * Shows Slack's loading indicator on the thread while the agent prepares a reply.
 *
 * Requires a bot token with the `chat:write` scope. Slack renders its own
 * "Working..." text here, because this method does not accept custom loading text.
 * The session times out to `active` after one hour; call again to reset the timer.
 */
export function showThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setSessionStatus(token, channelId, threadTs, "processing");
}

/**
 * Ends the loading indicator. Posting a reply does not clear it, so call this
 * once the reply has been sent.
 */
export function clearThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setSessionStatus(token, channelId, threadTs, "active");
}
