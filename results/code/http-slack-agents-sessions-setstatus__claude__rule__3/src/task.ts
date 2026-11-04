const SLACK_API = "https://slack.com/api";

interface SlackResponse {
  ok: boolean;
  error?: string;
}

export async function setThinkingStatus(
  channelId: string,
  threadTs: string,
  status = "Thinking...",
  token = process.env.SLACK_BOT_TOKEN,
): Promise<void> {
  if (!token) throw new Error("Missing Slack token (SLACK_BOT_TOKEN)");

  const res = await fetch(`${SLACK_API}/agents.sessions.setStatus`, {
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

  // Slack returns HTTP 200 with ok:false on API-level failures.
  const data = (await res.json()) as SlackResponse;
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error ?? "unknown_error"}`);
  }
}
