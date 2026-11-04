const SLACK_API = "https://slack.com/api";

interface SlackResponse {
  ok: boolean;
  error?: string;
}

async function setThreadStatus(
  channelId: string,
  threadTs: string,
  status: string,
): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("SLACK_BOT_TOKEN is not set");

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

  if (!res.ok) {
    throw new Error(`Slack HTTP error ${res.status}`);
  }
  const data = (await res.json()) as SlackResponse;
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error ?? "unknown_error"}`);
  }
}

/**
 * Shows a "Thinking..." status on the thread while the agent prepares a reply.
 * Requires a bot token (SLACK_BOT_TOKEN) with the `chat:write` scope.
 * Slack clears the status automatically when the app posts a reply in the
 * thread, or after two minutes with no reply.
 */
export async function showThinking(
  channelId: string,
  threadTs: string,
): Promise<void> {
  await setThreadStatus(channelId, threadTs, "Thinking...");
}

/** Clears the status early, e.g. if the agent fails and won't reply. */
export async function clearThinking(
  channelId: string,
  threadTs: string,
): Promise<void> {
  await setThreadStatus(channelId, threadTs, "");
}
