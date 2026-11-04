/** Call from a server with an Anthropic API key; never expose the key to browsers. */
export async function askHaiku(apiKey: string): Promise<string> {
  if (!apiKey.trim()) throw new Error("An Anthropic API key is required.");

  // Current model/thinking settings:
  // https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide
  // Current HTTP API version and authentication:
  // https://platform.claude.com/docs/en/api/http/messages/create
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2026-10-21",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [
        {
          role: "user",
          content:
            "Find all triples of positive integers (a, b, c) with a <= b <= c " +
            "such that 1/a + 1/b + 1/c = 1. Prove that your list is complete. " +
            "Return the final answer with its proof.",
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic Messages API failed: HTTP ${response.status}.`);
  }

  const message: {
    content?: Array<{ type: string; text?: string }>;
    stop_reason?: string;
  } = await response.json();

  // Reject truncated output, refusals, and other unfinished responses.
  if (message.stop_reason !== "end_turn") {
    throw new Error(`Claude did not finish an answer: ${message.stop_reason}.`);
  }
  if (!Array.isArray(message.content)) {
    throw new Error("Anthropic returned no content blocks.");
  }

  // Thinking and redacted-thinking blocks are deliberately excluded.
  const answer = message.content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();

  if (!answer) throw new Error("Claude returned no final answer text.");
  return answer;
}
