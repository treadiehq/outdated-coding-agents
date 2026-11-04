const MODEL = "gpt-6-luna";
const API_URL = "https://api.openai.com/v1/chat/completions";

interface ChatCompletionResponse {
  choices: { message: { content: string | null } }[];
}

export async function summarize(text: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "Summarize the user's text in exactly one sentence. Reply with only that sentence.",
        },
        { role: "user", content: text },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const summary = data.choices[0]?.message.content?.trim();
  if (!summary) {
    throw new Error("OpenAI response contained no summary");
  }
  return summary;
}
