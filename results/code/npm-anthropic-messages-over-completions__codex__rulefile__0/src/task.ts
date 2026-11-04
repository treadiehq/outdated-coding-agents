import Anthropic from '@anthropic-ai/sdk';

/** Sends a prompt to Claude using the ANTHROPIC_API_KEY environment variable. */
export async function generateText(prompt: string): Promise<string> {
  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('');
}
