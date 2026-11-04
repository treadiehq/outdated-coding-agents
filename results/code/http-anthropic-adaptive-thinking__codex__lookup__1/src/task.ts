/**
 * Call from a server runtime with native fetch, passing your Anthropic API key.
 * Docs checked: https://platform.claude.com/docs/en/models/haiku-5-5/overview
 * https://platform.claude.com/docs/en/api/http/messages/create
 */
export async function askHaiku(apiKey: string): Promise<string> {
  if (!apiKey.trim()) {
    throw new Error("An Anthropic API key is required.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "anthropic-version": "2026-10-21",
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      max_tokens: 16000,
      // Current Haiku uses adaptive thinking; budget_tokens is unsupported.
      thinking: { type: "adaptive", display: "omitted" },
      output_config: { effort: "high" },
      messages: [
        {
          role: "user",
          content:
            "There are 100 prisoners and 100 boxes, each containing one distinct " +
            "prisoner number. Each prisoner may inspect at most 50 boxes, and " +
            "they cannot communicate after inspections begin. All must find " +
            "their own number to succeed. What strategy gives them over a " +
            "30% chance of success? Derive its exact success probability and " +
            "explain why the strategy works. Return a self-contained final answer.",
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Anthropic Messages API failed (${response.status}): ${await response.text()}`,
    );
  }

  const message: unknown = await response.json();
  if (
    typeof message !== "object" || message === null ||
    !("content" in message) || !Array.isArray(message.content)
  ) {
    throw new Error("Anthropic returned an invalid message.");
  }
  if (!("stop_reason" in message) || message.stop_reason !== "end_turn") {
    throw new Error("Anthropic did not finish the answer.");
  }

  const answer = message.content
    .filter(
      (block: unknown): block is { type: "text"; text: string } =>
        typeof block === "object" && block !== null &&
        "type" in block && block.type === "text" &&
        "text" in block && typeof block.text === "string",
    )
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!answer) {
    throw new Error("Anthropic returned no final answer text.");
  }
  return answer;
}
