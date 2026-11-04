/**
 * Sets the status shown on an agent thread. Pass an empty string as `status`
 * to clear it. Requires a bot token with the `chat:write` scope.
 */
export async function setThreadStatus(
  token: string,
  channelId: string,
  threadTs: string,
  status = "Thinking...",
): Promise<void> {
  const response = await fetch(
    "https://slack.com/api/assistant.threads.setStatus",
    {
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
    },
  );

  if (!response.ok) {
    throw new Error(
      `assistant.threads.setStatus failed: HTTP ${response.status}`,
    );
  }

  // Slack reports most API errors with HTTP 200 and `ok: false`.
  const data = (await response.json()) as { ok: boolean; error?: string };
  if (!data.ok) {
    throw new Error(`assistant.threads.setStatus failed: ${data.error}`);
  }
}
