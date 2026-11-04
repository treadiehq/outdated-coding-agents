/** Call from a server environment; never expose the API key to a browser. */
export async function askHaiku(apiKey: string): Promise<string> {
  if (!apiKey.trim()) {
    throw new Error("An Anthropic API key is required.");
  }

  // Current model and thinking configuration:
  // https://platform.claude.com/docs/en/models/haiku-5-5/overview
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
            "Find the last ten decimal digits of 2^(2^1000). " +
            "Give the result as exactly ten digits, including leading zeros. " +
            "Return only that final answer.",
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic Messages API returned HTTP ${response.status}.`);
  }

  const message = (await response.json()) as {
    stop_reason: string;
    content: Array<{ type: string; text?: string }>;
  };

  if (message.stop_reason !== "end_turn") {
    throw new Error(`Claude did not finish its answer: ${message.stop_reason}.`);
  }

  const answer = message.content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();

  if (!answer) {
    throw new Error("Claude returned no final answer text.");
  }

  return answer;
}
