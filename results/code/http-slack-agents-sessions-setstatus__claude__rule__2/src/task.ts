const SLACK_API_URL = "https://slack.com/api/agents.sessions.setStatus";

interface SlackResponse {
  ok: boolean;
  error?: string;
}

/**
 * Shows a "Thinking..." status on the agent thread while a reply is prepared.
 * Slack clears the status automatically once the agent posts a reply.
 */
export async function setThinkingStatus(
  channelId: string,
  threadTs: string,
  token: string = process.env.SLACK_BOT_TOKEN ?? "",
): Promise<void> {
  if (!token) {
    throw new Error("Missing Slack bot token (SLACK_BOT_TOKEN)");
  }

  const response = await fetch(SLACK_API_URL, {
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

  if (!response.ok) {
    throw new Error(`Slack HTTP error: ${response.status} ${response.statusText}`);
  }

  // Slack returns HTTP 200 even for API errors, so check the body.
  const data = (await response.json()) as SlackResponse;
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error ?? "unknown_error"}`);
  }
}
