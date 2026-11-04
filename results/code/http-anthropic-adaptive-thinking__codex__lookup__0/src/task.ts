/** Ask Haiku a hard question. Call from a server to keep the API key private. */
export async function askHaiku(apiKey: string): Promise<string> {
  if (!apiKey.trim()) throw new Error("An Anthropic API key is required.");

  // Current API reference: https://platform.claude.com/docs/en/api/messages/create
  // Haiku 5.5 requires adaptive thinking rather than enabled/budget_tokens:
  // https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "anthropic-version": "2026-10-21",
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
            "Find the last ten decimal digits of 28433 * 2^7830457 + 1. " +
            "Use modular arithmetic to verify the result. " +
            "Return only the ten digits, including any leading zeros.",
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic Messages API failed (HTTP ${response.status}).`);
  }

  const message = (await response.json()) as {
    stop_reason?: string;
    content?: Array<{ type: string; text?: string }>;
  };

  // Never return a truncated answer, reasoning, or redacted thinking blocks.
  if (message.stop_reason !== "end_turn") {
    throw new Error(`Claude did not finish its answer: ${message.stop_reason}.`);
  }
  if (!Array.isArray(message.content)) {
    throw new Error("Anthropic returned no content blocks.");
  }

  const answer = message.content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();

  if (!answer) throw new Error("Claude returned no final answer text.");
  return answer;
}
