import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function generateText(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('');
}
