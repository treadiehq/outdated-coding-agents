const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2026-10-21";
const MODEL = "claude-haiku-5-5";
// Thinking tokens count toward max_tokens, so leave room for reasoning and the answer.
const MAX_TOKENS = 16000;

const HARD_QUESTION =
  "How many ways can a 4x10 rectangle be tiled with 1x2 dominoes? " +
  "Show the recurrence you use and check it against small cases.";

interface ContentBlock {
  type: string;
  text?: string;
}

interface MessageResponse {
  content: ContentBlock[];
  stop_reason: string | null;
}

export async function askHardQuestion(
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
    throw new Error(`Messages API error ${response.status}: ${await response.text()}`);
  }

  const message = (await response.json()) as MessageResponse;

  // A max_tokens stop can land mid-answer or before any text, and a refusal has no answer to return.
  if (message.stop_reason !== "end_turn") {
    throw new Error(`Claude did not finish its answer (stop_reason: ${message.stop_reason})`);
  }

  // The content array also holds thinking blocks; keep only the answer text.
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
}
