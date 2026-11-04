const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2026-10-21";
const MODEL = "claude-haiku-5-5";

type ContentBlock = { type: string; text?: string };

type MessagesResponse = {
  content: ContentBlock[];
  stop_reason: string | null;
};

/**
 * Asks Claude Haiku 5.5 a question with adaptive thinking enabled and
 * returns only the final answer text (thinking blocks are discarded).
 */
export async function askHardQuestion(
  question = "Prove that there are infinitely many primes p such that p mod 4 == 3.",
  apiKey = process.env.ANTHROPIC_API_KEY,
): Promise<string> {
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": API_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      // Thinking tokens count toward max_tokens, so leave generous headroom.
      max_tokens: 16000,
      // Adaptive thinking replaces the deprecated type "enabled" + budget_tokens,
      // which Claude 4.7+ models reject with a 400.
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as MessagesResponse;
  const answer = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");

  if (data.stop_reason === "max_tokens" && !answer) {
    throw new Error("Response hit max_tokens before producing a final answer");
  }
  return answer;
}
