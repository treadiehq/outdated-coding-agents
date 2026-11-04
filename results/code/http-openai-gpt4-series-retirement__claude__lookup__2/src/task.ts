const MODEL = "gpt-5.4-mini";
const API_URL = "https://api.openai.com/v1/responses";

type ResponsesOutput = {
  output?: Array<{
    type: string;
    content?: Array<{ type: string; text?: string }>;
  }>;
  error?: { message?: string } | null;
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
      max_output_tokens: 200,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as ResponsesOutput;
  if (!res.ok) {
    throw new Error(`OpenAI request failed (${res.status}): ${data.error?.message ?? res.statusText}`);
  }

  // The REST response has no top-level output_text; collect it from message items.
  const summary = (data.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text")
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!summary) throw new Error("OpenAI response contained no text output");
  return summary;
}
