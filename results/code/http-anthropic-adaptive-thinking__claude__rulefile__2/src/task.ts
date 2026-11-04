const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2026-10-21";
const MODEL = "claude-haiku-5-5";

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking?: string }
  | { type: "redacted_thinking" }
  | { type: string };

interface MessagesResponse {
  content: ContentBlock[];
  stop_reason: string | null;
}

const QUESTION =
  "Is there a closed-form formula for the number of distinct ways to tile a " +
  "3 x n rectangle with 1 x 2 dominoes? Derive the recurrence, solve it, " +
  "and state the answer for n = 10.";

/** Asks Claude Haiku a hard question with thinking on and returns only the final answer text. */
export async function askHardQuestion(question: string = QUESTION): Promise<string> {
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
      // Adaptive thinking; budget_tokens-style "enabled" is rejected on Claude 4.7+.
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
  const answer = data.content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!answer) {
    throw new Error(`No text in response (stop_reason: ${data.stop_reason})`);
  }
  return answer;
}
