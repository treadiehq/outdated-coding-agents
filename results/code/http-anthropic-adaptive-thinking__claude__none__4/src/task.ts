const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-5-5";

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "redacted_thinking"; data: string }
  | { type: string };

interface MessagesResponse {
  content: ContentBlock[];
}

const HARD_QUESTION =
  "Prove or disprove: there are infinitely many primes p such that p + 2 and p + 6 are both prime. " +
  "If the statement is an open problem, say so and summarize what is known.";

/** Asks Claude Haiku a hard question with extended thinking enabled; returns only the final answer text. */
export async function askHardQuestion(question: string = HARD_QUESTION): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

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
  // Drop thinking / redacted_thinking blocks; keep only the final text.
  return data.content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("");
}
