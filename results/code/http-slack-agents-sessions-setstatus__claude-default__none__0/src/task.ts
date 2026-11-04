const SET_STATUS_URL = "https://slack.com/api/agents.sessions.setStatus";

export interface AgentThread {
  /** Bot token (xoxb-) with the `chat:write` scope. */
  token: string;
  channelId: string;
  /** Timestamp of the thread's root message. */
  threadTs: string;
}

type SessionStatus = "processing" | "active";

async function setSessionStatus(
  { token, channelId, threadTs }: AgentThread,
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
    const retryAfter = response.headers.get("Retry-After");
    throw new Error(
      `agents.sessions.setStatus failed with HTTP ${response.status}` +
        (retryAfter ? ` (retry after ${retryAfter}s)` : ""),
    );
  }

  // Slack reports most failures with HTTP 200 and `ok: false`.
  const data = (await response.json()) as { ok: boolean; error?: string };
  if (!data.ok) {
    throw new Error(`agents.sessions.setStatus failed: ${data.error ?? "unknown_error"}`);
  }
}

/**
 * Shows Slack's loading indicator on the thread while the agent prepares a reply.
 *
 * Slack renders its own loading text for this status; the method doesn't accept
 * custom text. The indicator stays up until `clearThinkingStatus` is called or
 * the session times out after one hour.
 */
export function showThinkingStatus(thread: AgentThread): Promise<void> {
  return setSessionStatus(thread, "processing");
}

/**
 * Removes the loading indicator. Posting a reply doesn't do this automatically,
 * so call it once the agent has finished, including when preparing the reply fails.
 */
export function clearThinkingStatus(thread: AgentThread): Promise<void> {
  return setSessionStatus(thread, "active");
}
