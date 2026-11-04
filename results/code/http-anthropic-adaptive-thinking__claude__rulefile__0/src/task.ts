const MODEL = "claude-haiku-5-5";

type ContentBlock = { type: string; text?: string };

type MessagesResponse = {
  content: ContentBlock[];
  stop_reason: string | null;
};

export async function askHardQuestion(
  question = "Is there a closed-form solution to the three-body problem? Explain why or why not.",
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2026-10-21",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      // Claude 4.7+ rejects thinking.type "enabled" with budget_tokens; use adaptive + effort.
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Messages API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as MessagesResponse;

  // Drop thinking blocks; keep only the final answer text.
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");
}
