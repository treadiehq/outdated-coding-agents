/**
 * Call from a server with a secret API key; requires a runtime with native fetch.
 * API options checked against:
 * https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide
 * https://platform.claude.com/docs/en/api/http/messages/create
 */
export async function askClaudeHaiku(
  apiKey: string,
  question = "Find the last ten decimal digits of 7^(7^7). Give the exact digits and a concise mathematical justification.",
): Promise<string> {
  if (!apiKey.trim()) throw new Error("An Anthropic API key is required.");
  if (!question.trim()) throw new Error("A question is required.");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "anthropic-version": "2026-10-21",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic Messages API failed (HTTP ${response.status}).`);
  }

  const message: unknown = await response.json();
  if (
    typeof message !== "object" || message === null ||
    !("stop_reason" in message) || !("content" in message) ||
    !Array.isArray(message.content)
  ) {
    throw new Error("Invalid Anthropic Messages API response.");
  }
  // Reject refusals and truncated output instead of returning an incomplete answer.
  if (message.stop_reason !== "end_turn") {
    throw new Error(`Claude did not complete an answer (${String(message.stop_reason)}).`);
  }

  const answer = message.content
    .filter((block): block is { type: "text"; text: string } =>
      typeof block === "object" && block !== null &&
      block.type === "text" && typeof block.text === "string"
    )
    .map((block) => block.text)
    .join("")
    .trim();

  if (!answer) throw new Error("Claude returned no final answer text.");
  return answer;
}
