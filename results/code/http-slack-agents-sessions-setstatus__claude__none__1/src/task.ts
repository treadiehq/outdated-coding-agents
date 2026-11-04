interface SlackResponse {
  ok: boolean;
  error?: string;
}

/**
 * Shows a status such as "Thinking..." on an assistant thread while the agent
 * prepares a reply. Slack clears it automatically when the app posts a message
 * to the thread; pass an empty status to clear it manually.
 *
 * Calls https://slack.com/api/assistant.threads.setStatus
 * Requires a bot token with the `assistant:write` scope (or `chat:write`).
 */
export async function setThinkingStatus(
  channelId: string,
  threadTs: string,
  status: string = "Thinking...",
  token: string | undefined = process.env.SLACK_BOT_TOKEN,
): Promise<void> {
  if (!token) {
    throw new Error("Missing Slack bot token (pass it in or set SLACK_BOT_TOKEN)");
  }

  const res = await fetch("https://slack.com/api/assistant.threads.setStatus", {
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
    const retryAfter = res.headers.get("Retry-After") ?? "unknown";
    throw new Error(`Slack rate limited; retry after ${retryAfter}s`);
  }
  if (!res.ok) {
    throw new Error(`Slack HTTP error: ${res.status} ${res.statusText}`);
  }

  // Slack returns HTTP 200 even for API errors, so check the `ok` field.
  const data = (await res.json()) as SlackResponse;
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error ?? "unknown_error"}`);
  }
}
