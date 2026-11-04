const MODEL = "gpt-6-luna";
const API_URL = "https://api.openai.com/v1/responses";

interface ResponsesOutputItem {
  type: string;
  content?: { type: string; text?: string }[];
}

interface ResponsesResult {
  output?: ResponsesOutputItem[];
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
        "Summarize the user's text in exactly one sentence. Reply with the sentence only.",
      input: text,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI request failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as ResponsesResult;

  // `output` can hold several items (e.g. reasoning), so collect all output_text parts.
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
