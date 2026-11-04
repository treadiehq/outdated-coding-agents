const HARD_QUESTION =
  "Are there infinitely many prime numbers p such that p mod 4 == 3? Prove your answer.";

interface MessagesResponse {
  content: Array<{ type: string; text?: string }>;
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

  const message: MessagesResponse = await response.json();

  if (message.stop_reason === "refusal") {
    throw new Error("Claude declined the request (stop_reason: refusal)");
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error("Response was cut off before the answer finished (stop_reason: max_tokens)");
  }

  // Thinking blocks come before the answer, so select blocks by type rather than position.
  const answer = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");

  if (!answer) {
    throw new Error(`Response had no answer text (stop_reason: ${message.stop_reason})`);
  }
  return answer;
}
