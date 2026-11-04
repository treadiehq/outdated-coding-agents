/**
 * Show a custom thinking status before preparing an AI reply in a Slack thread.
 * Call server-side with your app's bot token, which needs chat:write.
 * Keep threadTs as a string containing the thread root's timestamp.
 *
 * Slack prefixes the status with the app name and clears it when the app replies
 * in the thread, or after two minutes. Pass "" to clear it explicitly on failure.
 *
 * This uses the supported legacy thread API for the exact custom text requested.
 * Slack recommends agents.sessions.setStatus for new integrations, but that API
 * takes lifecycle values such as "processing", not custom "Thinking..." text.
 * https://docs.slack.dev/reference/methods/assistant.threads.setStatus/
 * https://docs.slack.dev/reference/methods/agents.sessions.setStatus/
 *
 * @example
 * await setThinkingStatus(botToken, channelId, threadTs);
 * // Prepare and post your reply in the same thread.
 */
export async function setThinkingStatus(
  botToken: string,
  channelId: string,
  threadTs: string,
  status: "Thinking..." | "" = "Thinking...",
): Promise<void> {
  if (!botToken.trim() || !channelId.trim() || !threadTs.trim()) {
    throw new Error("botToken, channelId, and threadTs are required.");
  }

  const response = await fetch(
    "https://slack.com/api/assistant.threads.setStatus",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${botToken}`,
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
    const retryAfter = response.headers.get("Retry-After");
    throw new Error(
      `Slack status request failed: HTTP ${response.status}` +
        (retryAfter ? `; retry after ${retryAfter} seconds` : ""),
    );
  }

  // Slack can return HTTP 200 for an API failure; always check the JSON too.
  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null || !("ok" in result)) {
    throw new Error("Slack status request returned an invalid response.");
  }
  if (result.ok !== true) {
    const error =
      "error" in result && typeof result.error === "string"
        ? result.error
        : "unknown_error";
    throw new Error(`Slack status request failed: ${error}`);
  }
}
