/** Ask Claude a hard question using native fetch; keep the API key server-side. */
export async function askHaiku(apiKey: string): Promise<string> {
  if (!apiKey.trim()) throw new Error("An Anthropic API key is required.");

  // Current model and API: https://platform.claude.com/docs/en/models/haiku-5-5/overview
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "anthropic-version": "2026-10-21",
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      max_tokens: 16384,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [
        {
          role: "user",
          content:
            "Find the last ten decimal digits of 7^(7^7), where exponentiation " +
            "is right-associative. Return only the ten-digit answer, including " +
            "any leading zeroes, without explanation.",
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic Messages API failed: HTTP ${response.status}`);
  }

  const message = (await response.json()) as {
    stop_reason: string | null;
    content: Array<{ type: string; text?: string }>;
  };
  if (message.stop_reason !== "end_turn") {
    throw new Error(`Claude did not finish its answer: ${message.stop_reason}`);
  }

  // Exclude thinking and redacted_thinking blocks from the returned answer.
  const answer = message.content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();
  if (!answer) throw new Error("Claude returned no final answer text.");
  return answer;
}
