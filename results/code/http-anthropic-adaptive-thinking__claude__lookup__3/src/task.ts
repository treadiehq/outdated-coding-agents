const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2026-10-21";
const MODEL = "claude-haiku-5-5";

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "redacted_thinking"; data: string }
  | { type: string };

interface MessagesResponse {
  content: ContentBlock[];
  stop_reason: string | null;
}

/**
 * Asks Claude Haiku a hard question with adaptive thinking on and
 * returns only the final answer text (thinking blocks are dropped).
 */
export async function askHardQuestion(
  question = "Prove or disprove: there are infinitely many primes p such that p mod 4 == 3.",
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
      // Haiku 5.5 only supports adaptive thinking; type "enabled" + budget_tokens is rejected.
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
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("");

  if (!answer) {
    throw new Error(`No answer text returned (stop_reason: ${data.stop_reason})`);
  }
  return answer;
}
