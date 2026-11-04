import Anthropic from '@anthropic-ai/sdk';

/** Requires ANTHROPIC_API_KEY in the environment. */
export async function generateText(prompt: string): Promise<string> {
  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('');
}
