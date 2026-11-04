const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2026-10-21";
const MODEL = "claude-haiku-5-5";
// Thinking counts toward max_tokens, so leave room for it as well as the answer.
const MAX_TOKENS = 16000;

const HARD_QUESTION =
  "Are there infinitely many prime numbers p such that p mod 4 == 3? Give a complete proof.";

interface MessageResponse {
  content: Array<{ type: string; text?: string }>;
  stop_reason: string | null;
  stop_details?: { category?: string | null } | null;
}

export async function askHardQuestion(
  apiKey: string,
  question: string = HARD_QUESTION,
): Promise<string> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": API_VERSION,
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

  // Refusals and truncation both arrive as HTTP 200, so check for them explicitly.
  if (message.stop_reason === "refusal") {
    throw new Error(`Request refused: ${message.stop_details?.category ?? "unknown category"}`);
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error(`Response truncated at max_tokens (${MAX_TOKENS})`);
  }

  const answer = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");

  if (!answer) {
    throw new Error(`No answer text in response (stop_reason: ${message.stop_reason})`);
  }
  return answer;
}
