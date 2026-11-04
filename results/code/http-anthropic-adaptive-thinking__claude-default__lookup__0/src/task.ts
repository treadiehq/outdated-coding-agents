const HARD_QUESTION =
  "Prove or disprove: for every positive integer n, the number n^2 + n + 41 is prime. " +
  "If it is false, find the smallest counterexample and explain why it fails.";

interface MessagesResponse {
  content: { type: string; text?: string }[];
  stop_reason: string | null;
}

export async function askHaiku(
  apiKey: string,
  question: string = HARD_QUESTION,
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2026-10-21",
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
    throw new Error(`Messages API error ${response.status}: ${await response.text()}`);
  }

  const message = (await response.json()) as MessagesResponse;

  // Anything else (max_tokens, refusal, ...) means there is no complete answer to return.
  if (message.stop_reason !== "end_turn") {
    throw new Error(`No complete answer: stop_reason was ${message.stop_reason}`);
  }

  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}
