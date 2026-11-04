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
  question: string = "Is there a closed-form expression for the number of distinct necklaces of n beads in k colors, accounting for both rotations and reflections? Derive it and explain.",
): Promise<string> {
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
      // Extended thinking; budget_tokens must be < max_tokens.
      thinking: { type: "enabled", budget_tokens: 8000 },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as MessagesResponse;

  // Drop thinking blocks; keep only the final answer text.
  return data.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
}
