const SLACK_API = "https://slack.com/api";

type AgentSessionStatus = "active" | "processing" | "suspended" | "closed";

interface SetStatusResponse {
  ok: boolean;
  error?: string;
  status?: AgentSessionStatus;
  agent_status?: AgentSessionStatus;
}

async function setSessionStatus(
  token: string,
  channelId: string,
  threadTs: string,
  status: AgentSessionStatus,
): Promise<SetStatusResponse> {
  const res = await fetch(`${SLACK_API}/agents.sessions.setStatus`, {
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

  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After");
    throw new Error(`Slack rate limited (retry after ${retryAfter ?? "?"}s)`);
  }
  if (!res.ok) {
    throw new Error(`Slack HTTP error ${res.status}`);
  }

  // Slack returns HTTP 200 even on failure, so `ok` must always be checked.
  const data = (await res.json()) as SetStatusResponse;
  if (!data.ok) {
    throw new Error(`Slack agents.sessions.setStatus failed: ${data.error}`);
  }
  return data;
}

/**
 * Shows Slack's "thinking" loading state on the agent's thread while a reply
 * is prepared. Requires a granular bot token with the `chat:write` scope.
 *
 * Slack has no clear operation for this method: the state changes when you
 * set another status, so call `markThreadReady` (or `markThreadAwaitingUser`)
 * once the reply has been sent.
 */
export async function showThinking(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  await setSessionStatus(token, channelId, threadTs, "processing");
}

/** Returns the thread to the idle state after the reply is posted. */
export async function markThreadReady(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  await setSessionStatus(token, channelId, threadTs, "active");
}
