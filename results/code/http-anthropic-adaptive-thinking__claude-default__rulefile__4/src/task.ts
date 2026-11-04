const HARD_QUESTION =
  "A fair coin is flipped repeatedly until either HTH or HHT appears as three " +
  "consecutive flips. What is the probability that HHT appears first, and what " +
  "is the expected number of flips until the game ends? Give exact fractions.";

type ContentBlock = { type: "text"; text: string } | { type: string };

interface MessageResponse {
  content: ContentBlock[];
  stop_reason: string | null;
}

export async function askHardQuestion(
  apiKey: string,
  question: string = HARD_QUESTION,
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2026-10-21",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      // Thinking tokens count toward max_tokens, so leave room for them.
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Anthropic API error ${response.status}: ${await response.text()}`,
    );
  }

  const message = (await response.json()) as MessageResponse;

  // Refusals arrive as HTTP 200, and a truncated response may hold only thinking.
  if (message.stop_reason !== "end_turn") {
    throw new Error(`No complete answer: stop_reason ${message.stop_reason}`);
  }

  // Thinking blocks come before the answer, so select by type, not position.
  return message.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");
}
