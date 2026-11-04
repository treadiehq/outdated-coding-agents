import Anthropic from "@anthropic-ai/sdk";

// Reads the API key from the ANTHROPIC_API_KEY environment variable.
const client = new Anthropic();

export async function generateText(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}
