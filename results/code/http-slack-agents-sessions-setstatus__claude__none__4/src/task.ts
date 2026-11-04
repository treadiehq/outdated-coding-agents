const SLACK_API_URL = "https://slack.com/api";

interface SlackResponse {
  ok: boolean;
  error?: string;
}

/**
 * Shows a status (default "Thinking...") on an assistant thread while the
 * agent prepares a reply, via assistant.threads.setStatus.
 *
 * Requires a bot token with the `assistant:write` scope. Slack clears the
 * status automatically when the app posts a reply in the thread; to clear it
 * manually, call this with an empty string.
 */
export async function setThinkingStatus(
  token: string,
  channelId: string,
  threadTs: string,
  status: string = "Thinking...",
): Promise<void> {
  const res = await fetch(`${SLACK_API_URL}/assistant.threads.setStatus`, {
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

  if (!res.ok) {
    throw new Error(`Slack HTTP error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as SlackResponse;
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error ?? "unknown_error"}`);
  }
}
