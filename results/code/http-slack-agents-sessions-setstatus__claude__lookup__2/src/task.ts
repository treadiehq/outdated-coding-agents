const SLACK_API = "https://slack.com/api";

interface SlackResponse {
  ok: boolean;
  error?: string;
}

/**
 * Sets the status on an assistant thread via assistant.threads.setStatus.
 *
 * Requires a bot token with `chat:write`. Slack renders the status as
 * `<App Name> <status>`, so "is thinking..." displays as "<App> is thinking...".
 * The status clears automatically when the app posts a reply, or after two
 * minutes with no message. Pass an empty string to clear it explicitly.
 *
 * Note: Slack's docs say this method is being replaced by
 * agents.sessions.setStatus, but that method only sets a session lifecycle
 * state (active/processing/suspended/closed), not free-text status.
 */
export async function setThreadStatus(
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
    throw new Error(`Slack rate limited (retry after ${retryAfter ?? "?"}s)`);
  }
  if (!res.ok) {
    throw new Error(`Slack HTTP error ${res.status}`);
  }

  const data = (await res.json()) as SlackResponse;
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error ?? "unknown_error"}`);
  }
}

/** Shows "Thinking..." on the thread while the agent prepares a reply. */
export function showThinking(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  return setThreadStatus(token, channelId, threadTs, "is thinking...");
}
