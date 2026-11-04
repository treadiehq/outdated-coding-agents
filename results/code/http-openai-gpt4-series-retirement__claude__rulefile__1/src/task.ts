const MODEL = "gpt-6-luna";
const API_URL = "https://api.openai.com/v1/responses";

type ResponsesResult = {
  error?: { message?: string } | null;
  output?: Array<{
    type: string;
    content?: Array<{ type: string; text?: string; refusal?: string }>;
  }>;
};

export async function summarize(text: string, apiKey = process.env.OPENAI_API_KEY): Promise<string> {
  if (!apiKey) throw new Error("Missing OpenAI API key (set OPENAI_API_KEY)");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      instructions: "Summarize the user's text in exactly one sentence. Reply with only that sentence.",
      input: text,
      reasoning: { effort: "none" },
      max_output_tokens: 200,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as ResponsesResult;
  if (!res.ok) {
    throw new Error(`OpenAI request failed (${res.status}): ${data.error?.message ?? res.statusText}`);
  }

  const parts = (data.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? []);

  const refusal = parts.find((p) => p.type === "refusal");
  if (refusal) throw new Error(`Model refused: ${refusal.refusal ?? ""}`);

  const summary = parts
    .filter((p) => p.type === "output_text")
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!summary) throw new Error("OpenAI response contained no text output");
  return summary;
}
