const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2026-10-21";
const MODEL = "claude-haiku-5-5";

type ContentBlock = { type: "text"; text: string } | { type: string; [key: string]: unknown };

interface MessagesResponse {
  content: ContentBlock[];
}

export async function askHardQuestion(
  question = "Is there a closed-form formula for the number of distinct necklaces of n beads in k colors, accounting for rotations and reflections? Derive it and state the final result.",
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
      max_tokens: 16000,
      // Haiku 5.5 uses adaptive thinking; `type: "enabled"` + budget_tokens is rejected with a 400.
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
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("");
}
