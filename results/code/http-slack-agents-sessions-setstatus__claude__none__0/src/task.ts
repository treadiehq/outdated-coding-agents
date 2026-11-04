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
 * thread. To clear it manually, call with `status: ""`.
 */
export async function setThinkingStatus(
  channelId: string,
  threadTs: string,
  options: { token?: string; status?: string } = {},
): Promise<void> {
  const token = options.token ?? process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("Missing Slack token: pass options.token or set SLACK_BOT_TOKEN");
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
      status: options.status ?? "Thinking...",
    }),
  });

  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After");
    throw new Error(`Slack rate limited; retry after ${retryAfter ?? "?"}s`);
  }
  if (!res.ok) {
    throw new Error(`Slack HTTP error: ${res.status} ${res.statusText}`);
  }

  // Slack returns HTTP 200 even for API errors; check the `ok` field.
  const data = (await res.json()) as SlackResponse;
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error ?? "unknown_error"}`);
  }
}
