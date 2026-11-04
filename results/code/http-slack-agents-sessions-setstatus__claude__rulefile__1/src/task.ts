interface SlackResponse {
  ok: boolean;
  error?: string;
}

/**
 * Shows a status (default "Thinking...") on an assistant thread while the agent
 * prepares a reply. Slack clears it automatically when the app posts a message
 * in the thread, or after ~2 minutes. Pass an empty string to clear it manually.
 *
 * Uses assistant.threads.setStatus (needs a bot token with `chat:write`).
 * Slack lists it as superseded by agents.sessions.setStatus, but that method
 * only takes a lifecycle state (active/processing/...), not custom text, so the
 * older method is used to get a "Thinking..." message.
 */
export async function setThinkingStatus(
  channelId: string,
  threadTs: string,
  status = "Thinking...",
  token = process.env.SLACK_BOT_TOKEN,
): Promise<void> {
  if (!token) throw new Error("Missing Slack bot token (SLACK_BOT_TOKEN)");

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

  if (!res.ok) {
    throw new Error(`Slack HTTP error ${res.status}: ${res.statusText}`);
  }

  const data = (await res.json()) as SlackResponse;
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error ?? "unknown_error"}`);
  }
}
