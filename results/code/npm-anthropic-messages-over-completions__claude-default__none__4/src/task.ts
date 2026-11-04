import Anthropic from "@anthropic-ai/sdk";

// Reads the API key from the ANTHROPIC_API_KEY environment variable.
const client = new Anthropic();

export async function generateText(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    messages: [{ role: "user", content: prompt }],
  });

  if (message.stop_reason === "refusal" || message.stop_reason === "max_tokens") {
    throw new Error(`Claude did not finish its response: ${message.stop_reason}`);
  }

  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}
