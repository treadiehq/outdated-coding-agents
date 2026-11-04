type ContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "redacted_thinking"; data: string };

interface MessagesResponse {
  content: ContentBlock[];
}

const HARD_QUESTION =
  "Prove or disprove: there are infinitely many primes p such that p + 2 and p + 6 are both prime. " +
  "Explain what is known and what is open, then give a concise final answer.";

export async function askHardQuestion(question: string = HARD_QUESTION): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as MessagesResponse;

  // Keep only the final answer; drop thinking blocks.
  return data.content
    .filter((b): b is Extract<ContentBlock, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");
}
