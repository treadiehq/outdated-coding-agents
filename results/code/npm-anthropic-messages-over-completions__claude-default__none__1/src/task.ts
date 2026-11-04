import Anthropic from "@anthropic-ai/sdk";

// Reads ANTHROPIC_API_KEY from the environment.
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
    throw new Error("Claude's response was truncated at the max_tokens limit");
  }

  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}
