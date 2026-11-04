import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateText(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-opus-5-5",
    // Thinking is always on for this model and counts toward max_tokens.
    max_tokens: 16000,
    messages: [{ role: "user", content: prompt }],
  });

  // The response can include thinking blocks, so keep only the text blocks.
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}
