import Anthropic from "@anthropic-ai/sdk";

// Reads the API key from the ANTHROPIC_API_KEY environment variable.
const client = new Anthropic();

export async function generateText(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    messages: [{ role: "user", content: prompt }],
  });

  if (message.stop_reason === "refusal") {
    throw new Error("Claude declined to respond to the prompt");
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error("Claude's response was cut off at the max_tokens limit");
  }

  // The response can include non-text blocks such as thinking, so keep only text.
  return message.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("");
}
