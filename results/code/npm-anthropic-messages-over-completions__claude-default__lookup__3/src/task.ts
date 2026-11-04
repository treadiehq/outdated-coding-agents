import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function generateText(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-opus-5-5',
    // Covers thinking as well as text, since thinking is always on for this model.
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  if (message.stop_reason !== 'end_turn') {
    throw new Error(`Claude did not finish its response (stop_reason: ${message.stop_reason})`);
  }

  // Select by type, because thinking blocks can come before the text.
  return message.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('');
}
