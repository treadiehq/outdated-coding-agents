interface SlackResponse {
  ok: boolean;
  error?: string;
}

/**
 * Shows a "Thinking..." status on the agent thread while a reply is prepared.
 * Slack clears the status automatically when the agent posts a reply.
 */
export async function setThinkingStatus(
  channelId: string,
  threadTs: string,
  token: string = process.env.SLACK_BOT_TOKEN ?? "",
): Promise<void> {
  if (!token) {
    throw new Error("Missing Slack bot token (SLACK_BOT_TOKEN)");
  }

  const res = await fetch("https://slack.com/api/agents.sessions.setStatus", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel_id: channelId,
      thread_ts: threadTs,
      status: "Thinking...",
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
