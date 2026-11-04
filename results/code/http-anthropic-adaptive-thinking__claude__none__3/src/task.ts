const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-5-5";

interface ContentBlock {
  type: string;
  text?: string;
}

interface MessagesResponse {
  content: ContentBlock[];
}

export async function askHardQuestion(
  question = "Prove or disprove: there are infinitely many primes p such that p + 2 and p + 6 are also prime.",
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "enabled", budget_tokens: 8000 },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as MessagesResponse;

  // Drop "thinking" / "redacted_thinking" blocks; keep only the final text.
  return data.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
}
