const HARD_QUESTION =
  "How many positive integers below 10^6 have a decimal digit sum of exactly 27 " +
  "and are divisible by 11? Reason carefully and state the final number.";

type ContentBlock = { type: "text"; text: string } | { type: string };

interface MessagesResponse {
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
    throw new Error(`Messages API error ${response.status}: ${await response.text()}`);
  }

  const message = (await response.json()) as MessagesResponse;

  if (message.stop_reason === "refusal") {
    throw new Error("Claude declined to answer the question");
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error("Response hit max_tokens before the answer was complete");
  }

  const answer = message.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");

  if (!answer) {
    throw new Error(`Response had no answer text (stop_reason: ${message.stop_reason})`);
  }
  return answer;
}
