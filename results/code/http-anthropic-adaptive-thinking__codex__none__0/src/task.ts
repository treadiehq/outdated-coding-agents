/** Call from a server with an Anthropic API key; returns no thinking blocks. */
export async function askHaiku(apiKey: string): Promise<string> {
  if (!apiKey.trim()) throw new Error("An Anthropic API key is required.");

  // Current Haiku: https://platform.claude.com/docs/en/models/haiku-5-5/overview
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
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
            "Find all positive integer pairs (x, y) satisfying x^2 + y^2 + 1 = 3xy. " +
            "Give a complete characterization and a rigorous proof that no solutions are missing.",
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Anthropic Messages API error (${response.status}): ${await response.text()}`,
    );
  }

  const message = (await response.json()) as {
    stop_reason: string | null;
    content: Array<{ type: string; text?: string }>;
  };
  if (message.stop_reason !== "end_turn") {
    throw new Error(`Claude did not finish its answer: ${message.stop_reason}`);
  }

  const answer = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("")
    .trim();
  if (!answer) throw new Error("Claude returned no final answer text.");
  return answer;
}
