const SLACK_API = "https://slack.com/api";

interface SlackResponse {
  ok: boolean;
  error?: string;
  detail?: string;
}

/**
 * Shows the "thinking" loading state on a thread with the agent while it
 * prepares a reply.
 *
 * Uses agents.sessions.setStatus, which replaces the older
 * assistant.threads.setStatus. Requires a granular bot token with the
 * `chat:write` scope, and the app must be a member of the channel. Slack
 * controls the displayed text for the `processing` state; it is not
 * customizable here.
 */
export async function showThinking(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  const res = await fetch(`${SLACK_API}/agents.sessions.setStatus`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel_id: channelId,
      thread_ts: threadTs,
      status: "processing",
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
      `Slack agents.sessions.setStatus failed: ${data.error}${data.detail ? ` (${data.detail})` : ""}`,
    );
  }
}

/**
 * Clears the thinking state without posting a message (e.g. if the agent
 * decides not to reply). Posting a reply in the thread also clears it.
 */
export async function clearThinking(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<void> {
  const res = await fetch(`${SLACK_API}/agents.sessions.setStatus`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel_id: channelId,
      thread_ts: threadTs,
      status: "active",
    }),
  });
  const data = (await res.json()) as SlackResponse;
  if (!data.ok) {
    throw new Error(`Slack agents.sessions.setStatus failed: ${data.error}`);
  }
}
