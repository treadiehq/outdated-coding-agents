const MODEL = "gpt-6-luna";
const API_URL = "https://api.openai.com/v1/responses";

interface ResponsesResult {
  status?: string;
  error?: { message?: string } | null;
  output?: Array<{
    type: string;
    content?: Array<{ type: string; text?: string; refusal?: string }>;
  }>;
}

export async function summarize(text: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      instructions:
        "Summarize the user's text in exactly one sentence. Reply with only that sentence.",
      input: text,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI request failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as ResponsesResult;
  if (data.error) {
    throw new Error(`OpenAI error: ${data.error.message ?? "unknown"}`);
  }

  const parts = (data.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? []);

  const refusal = parts.find((p) => p.type === "refusal");
  if (refusal) throw new Error(`Model refused: ${refusal.refusal}`);

  const summary = parts
    .filter((p) => p.type === "output_text")
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!summary) throw new Error(`No text in response (status: ${data.status})`);
  return summary;
}
