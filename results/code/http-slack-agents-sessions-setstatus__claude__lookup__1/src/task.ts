const SLACK_API = "https://slack.com/api";

type AgentSessionStatus = "active" | "processing" | "suspended" | "closed";

interface SetStatusResponse {
  ok: boolean;
  error?: string;
  status?: AgentSessionStatus;
  agent_status?: AgentSessionStatus;
}

async function setSessionStatus(
  channelId: string,
  threadTs: string,
  status: AgentSessionStatus,
): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("SLACK_BOT_TOKEN is not set");

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
    throw new Error(`Slack rate limited; retry after ${retryAfter ?? "?"}s`);
  }
  if (!res.ok) {
    throw new Error(`Slack HTTP error ${res.status}`);
  }

  const data = (await res.json()) as SetStatusResponse;
  if (!data.ok) {
    throw new Error(`Slack agents.sessions.setStatus failed: ${data.error}`);
  }
}

/**
 * Shows Slack's "thinking" loading state on the thread while the agent
 * prepares a reply. Call before generating the reply.
 *
 * Uses agents.sessions.setStatus (assistant.threads.setStatus is deprecated).
 * Requires a granular bot token with the `chat:write` scope. Slack renders
 * its own loading UI for `processing`; custom status text is not supported.
 */
export function showThinking(channelId: string, threadTs: string): Promise<void> {
  return setSessionStatus(channelId, threadTs, "processing");
}

/** Marks the session ready for the next prompt (call if no reply is sent). */
export function clearThinking(channelId: string, threadTs: string): Promise<void> {
  return setSessionStatus(channelId, threadTs, "active");
}
