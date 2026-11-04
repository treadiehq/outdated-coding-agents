import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function generateText(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  });

  // Refused or truncated responses have missing or partial text.
  if (message.stop_reason !== 'end_turn') {
    throw new Error(`Claude did not finish its response: ${message.stop_reason}`);
  }

  return message.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('');
}
