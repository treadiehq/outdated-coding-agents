const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2026-10-21";
const MODEL = "claude-haiku-5-5";

interface ContentBlock {
  type: string;
  text?: string;
}

interface MessagesResponse {
  content: ContentBlock[];
}

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
      // Adaptive thinking is the current mode; `type: "enabled"` + `budget_tokens`
      // is rejected on Claude 5 models. Depth is steered with effort.
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Messages API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as MessagesResponse;

  // Keep only the final answer; thinking blocks are dropped.
  return data.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
}
