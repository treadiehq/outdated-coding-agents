import Anthropic from "@anthropic-ai/sdk";

// Reads ANTHROPIC_API_KEY from the environment.
const client = new Anthropic();

export async function askClaude(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  return message.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");
}
