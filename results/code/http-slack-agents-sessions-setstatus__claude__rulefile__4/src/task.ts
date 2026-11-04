const SLACK_API = "https://slack.com/api";

interface SlackResponse {
  ok: boolean;
  error?: string;
}

/**
 * Shows a status (default "Thinking...") on an assistant thread while the agent
 * prepares a reply. Slack prefixes it with the app name and clears it
 * automatically when the app posts a reply, or after two minutes.
 *
 * Requires a bot token with the `chat:write` scope.
 * Pass an empty `status` to clear it manually.
 */
export async function setThinkingStatus(
  channelId: string,
  threadTs: string,
  status = "Thinking...",
  token = process.env.SLACK_BOT_TOKEN,
): Promise<void> {
  if (!token) {
    throw new Error("Missing Slack bot token (set SLACK_BOT_TOKEN)");
  }

  const res = await fetch(`${SLACK_API}/assistant.threads.setStatus`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token}`,
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
