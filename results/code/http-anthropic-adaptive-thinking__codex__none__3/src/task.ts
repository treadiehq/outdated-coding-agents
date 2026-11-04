/** Uses native fetch; pass your Anthropic API key from a server-side secret. */
export async function askHaiku(apiKey: string): Promise<string> {
  if (!apiKey.trim()) throw new Error("An Anthropic API key is required.");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      // Current Haiku model: https://platform.claude.com/docs/en/models/haiku-5-5/overview
      model: "claude-haiku-5-5",
      max_tokens: 16000,
      thinking: { type: "adaptive", display: "omitted" },
      output_config: { effort: "high" },
      messages: [
        {
          role: "user",
          content:
            "Find the last ten decimal digits of 2^(2^1000). Return only the ten-digit answer, including any leading zeros.",
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

  const answer = message.content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();

  if (!answer) throw new Error("Claude returned no final answer text.");
  return answer;
}
