const SLACK_API = "https://slack.com/api";

interface SlackResponse {
  ok: boolean;
  error?: string;
}

async function setThreadStatus(
  token: string,
  channelId: string,
  threadTs: string,
  status: string,
): Promise<void> {
  const res = await fetch(`${SLACK_API}/assistant.threads.setStatus`, {
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

  const data = (await res.json()) as SlackResponse;
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error ?? "unknown_error"}`);
  }
}

/**
 * Shows a "Thinking..." status on the user's thread with the agent.
 * Slack clears it automatically when the agent posts a reply in the thread,
 * or after two minutes if no message is sent.
 * Requires a bot token with the `chat:write` scope.
 */
export async function showThinking(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  await setThreadStatus(token, channelId, threadTs, "Thinking...");
}

/** Clears the status immediately (e.g. if you fail before replying). */
export async function clearThinking(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  await setThreadStatus(token, channelId, threadTs, "");
}
