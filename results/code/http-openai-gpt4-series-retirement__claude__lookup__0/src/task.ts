const MODEL = "gpt-6-luna";
const RESPONSES_URL = "https://api.openai.com/v1/responses";

interface ResponsesResult {
  status?: string;
  output?: Array<{
    type: string;
    content?: Array<{ type: string; text?: string; refusal?: string }>;
  }>;
  error?: { message?: string } | null;
}

export async function summarize(
  text: string,
  apiKey: string | undefined = process.env.OPENAI_API_KEY,
): Promise<string> {
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch(RESPONSES_URL, {
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
  if (data.error?.message) throw new Error(data.error.message);

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

  if (!summary) throw new Error(`No summary returned (status: ${data.status})`);
  return summary;
}
