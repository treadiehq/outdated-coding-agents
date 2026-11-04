const SLACK_API = "https://slack.com/api";

interface SlackResponse {
  ok: boolean;
  error?: string;
}

/**
 * Shows a status (default "Thinking...") on an AI assistant thread while the
 * agent prepares a reply. Slack clears it automatically when the app posts a
 * message in the thread, or after two minutes of inactivity.
 *
 * Requires a bot token with the `chat:write` scope (`assistant:write` is also
 * accepted for now).
 */
export async function setThinkingStatus(
  channelId: string,
  threadTs: string,
  status = "Thinking...",
  token = process.env.SLACK_BOT_TOKEN,
): Promise<void> {
  if (!token) throw new Error("Missing Slack bot token (SLACK_BOT_TOKEN)");

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
    throw new Error(`Slack HTTP error ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as SlackResponse;
  if (!data.ok) {
    throw new Error(`Slack assistant.threads.setStatus failed: ${data.error}`);
  }
}

/** Clears the status without posting a message. */
export function clearThreadStatus(
  channelId: string,
  threadTs: string,
  token = process.env.SLACK_BOT_TOKEN,
): Promise<void> {
  return setThinkingStatus(channelId, threadTs, "", token);
}
