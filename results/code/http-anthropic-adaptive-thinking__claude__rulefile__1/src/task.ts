const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2026-10-21";
const MODEL = "claude-haiku-5-5";

const HARD_QUESTION =
  "Prove or disprove: there are infinitely many primes p such that p mod 4 == 3. " +
  "Give the final answer with a concise justification.";

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "redacted_thinking" }
  | { type: string };

interface MessagesResponse {
  content: ContentBlock[];
}

/** Asks Claude Haiku a hard question with adaptive thinking on; returns only the final answer text. */
export async function askHardQuestion(question: string = HARD_QUESTION): Promise<string> {
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
      // Haiku 5.5 rejects manual `enabled` + budget_tokens; adaptive thinking is the supported mode.
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
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
