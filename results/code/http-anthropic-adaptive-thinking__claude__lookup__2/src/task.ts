const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2026-10-21";
const MODEL = "claude-haiku-5-5";

const HARD_QUESTION =
  "Prove or disprove: there are infinitely many primes p such that p mod 4 == 3. " +
  "Give a concise proof.";

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string; signature: string }
  | { type: "redacted_thinking"; data: string }
  | { type: string };

interface MessagesResponse {
  content: ContentBlock[];
  stop_reason: string | null;
}

/** Asks Claude Haiku a hard question with thinking on and returns only the final answer text. */
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
      // Claude 5 models reject thinking.type "enabled" + budget_tokens; adaptive thinking
      // with an effort level is the current way. Thinking text is not needed, so omit it.
      thinking: { type: "adaptive", display: "omitted" },
      output_config: { effort: "high" },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Messages API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as MessagesResponse;
  if (data.stop_reason === "max_tokens") {
    throw new Error("Response was cut off at max_tokens before the answer finished");
  }

  return data.content
    .filter((b): b is Extract<ContentBlock, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");
}
