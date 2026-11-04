const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2026-10-21";
const MODEL = "claude-haiku-5-5";

// Thinking tokens count toward max_tokens, so leave room for them and the answer.
const MAX_TOKENS = 16000;

const HARD_QUESTION =
  "How many positive integers n <= 1000 make n^2 + n + 41 composite? " +
  "Show the result as a single number with a brief justification.";

interface ContentBlock {
  type: string;
  text?: string;
}

interface MessageResponse {
  content: ContentBlock[];
  stop_reason: string | null;
}

export async function askClaude(
  apiKey: string,
  question: string = HARD_QUESTION,
): Promise<string> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": API_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
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

  // A max_tokens stop can land mid-answer or before any text, and a refusal has no usable answer.
  if (message.stop_reason !== "end_turn") {
    throw new Error(`Unexpected stop_reason: ${message.stop_reason}`);
  }

  // The response also holds thinking blocks; only text blocks are the answer.
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
}
