const SLACK_API = "https://slack.com/api";

interface SlackResponse {
  ok: boolean;
  error?: string;
  detail?: string;
}

/**
 * Shows a "Thinking..." status on an assistant thread while the agent prepares
 * a reply. Slack clears it automatically when the agent posts a message, or
 * after two minutes. Pass an empty string as `status` to clear it manually.
 *
 * Requires a bot token with the `chat:write` scope.
 */
export async function setThinkingStatus(
  channelId: string,
  threadTs: string,
  status = "Thinking...",
  token: string | undefined = process.env.SLACK_BOT_TOKEN,
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
    throw new Error(`Slack HTTP error ${res.status}`);
  }

  const data = (await res.json()) as SlackResponse;
  if (!data.ok) {
    throw new Error(
      `Slack assistant.threads.setStatus failed: ${data.error ?? "unknown_error"}` +
        (data.detail ? ` (${data.detail})` : ""),
    );
  }
}
