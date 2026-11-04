const HARD_QUESTION =
  "Are there infinitely many primes p such that p mod 4 == 3? Prove your answer.";

interface MessagesResponse {
  content: Array<{ type: string; text?: string }>;
  stop_reason: string | null;
}

export async function askHaiku(
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
      // Thinking counts toward max_tokens, so leave room for it and the answer.
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

  const message = (await response.json()) as MessagesResponse;

  // Anything else (such as "refusal" or "max_tokens") means no complete answer.
  if (message.stop_reason !== "end_turn") {
    throw new Error(`Claude did not finish: ${message.stop_reason}`);
  }

  // Select by type: the response can start with thinking blocks.
  const answer = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");

  if (!answer) {
    throw new Error("Claude returned no answer text");
  }

  return answer;
}
