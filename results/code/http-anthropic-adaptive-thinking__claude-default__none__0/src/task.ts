const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2026-10-21";
const MODEL = "claude-haiku-5-5";

const HARD_QUESTION =
  "Are there infinitely many primes p such that p mod 4 == 3? Prove your answer.";

interface MessagesResponse {
  content: Array<{ type: string; text?: string }>;
  stop_reason: string | null;
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
      // Thinking tokens count toward max_tokens, so leave room for both.
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Messages API error ${response.status}: ${await response.text()}`,
    );
  }

  const message = (await response.json()) as MessagesResponse;

  if (message.stop_reason === "refusal") {
    throw new Error("Claude declined to answer this request");
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error("Response was cut off by max_tokens before it finished");
  }

  // Responses can start with thinking blocks, so select by type, not position.
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
}
