import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function generateText(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  });

  if (message.stop_reason === 'refusal' || message.stop_reason === 'max_tokens') {
    throw new Error(`Claude did not finish the response: ${message.stop_reason}`);
  }

  // Thinking is always on for this model, so the content can include non-text blocks.
  return message.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('');
}
