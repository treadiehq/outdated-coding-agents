const HARD_QUESTION =
  "Prove or disprove: for every integer n > 1, there is a prime p with n < p < 2n. " +
  "Then state the smallest n for which there are at least three such primes, and justify it.";

type ContentBlock = { type: "text"; text: string } | { type: string };

type MessagesResponse = {
  content: ContentBlock[];
  stop_reason: string | null;
};

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
      // Thinking tokens count toward max_tokens, so leave room for the answer too.
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Messages API error ${response.status}: ${await response.text()}`);
  }

  const message = (await response.json()) as MessagesResponse;

  // A refusal or a max_tokens cutoff can leave the text missing or incomplete.
  if (message.stop_reason !== "end_turn") {
    throw new Error(`Claude did not finish its answer (stop_reason: ${message.stop_reason})`);
  }

  // Thinking blocks come before the text, so select blocks by type, not position.
  return message.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");
}
