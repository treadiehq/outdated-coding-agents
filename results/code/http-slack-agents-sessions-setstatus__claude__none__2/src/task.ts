const SLACK_API_URL = "https://slack.com/api/assistant.threads.setStatus";

interface SlackResponse {
  ok: boolean;
  error?: string;
}

/**
 * Shows a status (default "Thinking...") on an assistant thread while the
 * agent prepares a reply. Requires a bot token with the `assistant:write` scope.
 *
 * Slack clears the status automatically when the app posts a reply in the
 * thread. To clear it manually, call this with `status: ""`.
 */
export async function setThreadStatus(
  channelId: string,
  threadTs: string,
  status = "Thinking...",
  token: string | undefined = process.env.SLACK_BOT_TOKEN,
): Promise<void> {
  if (!token) {
    throw new Error("Missing Slack bot token (set SLACK_BOT_TOKEN)");
  }

  const res = await fetch(SLACK_API_URL, {
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
