const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2026-10-21";
const MODEL = "claude-haiku-5-5";

interface TextBlock {
  type: "text";
  text: string;
}

interface MessagesResponse {
  content: Array<TextBlock | { type: string }>;
}

export async function askHardQuestion(
  question: string = "Is there an infinite number of primes p such that p mod 4 == 3? Prove your answer.",
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
      // Haiku 5.5 only supports adaptive thinking; `type: "enabled"` + budget_tokens returns a 400.
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as MessagesResponse;

  // Drop thinking blocks; keep only the final answer text.
  return data.content
    .filter((block): block is TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}
