const MODEL = "gpt-5.4-mini";
const RESPONSES_URL = "https://api.openai.com/v1/responses";

type ResponsesResult = {
  error?: { message?: string } | null;
  output?: Array<{
    type: string;
    content?: Array<{ type: string; text?: string }>;
  }>;
};

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

  const data = (await res.json()) as ResponsesResult;
  if (!res.ok) {
    throw new Error(
      `OpenAI request failed (${res.status}): ${data.error?.message ?? res.statusText}`,
    );
  }

  const summary = data.output
    ?.filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text")
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!summary) throw new Error("OpenAI response contained no text output");
  return summary;
}
