const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2026-10-21";
const MODEL = "claude-haiku-5-5";

type ContentBlock = { type: string; text?: string };

type MessagesResponse = {
  content: ContentBlock[];
  stop_reason: string | null;
};

export async function askHardQuestion(
  question = "Prove that there are infinitely many primes p such that p mod 4 == 3.",
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
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
      max_tokens: 16000,
      // Haiku 5.5 uses adaptive thinking; `type: "enabled"` + budget_tokens is rejected.
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as MessagesResponse;

  // Drop thinking / redacted_thinking blocks; keep only the final answer text.
  return data.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
}
