import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // Reads ANTHROPIC_API_KEY from the environment

export async function generateText(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000, // Covers thinking plus text, since thinking is always on for this model
    messages: [{ role: 'user', content: prompt }],
  });

  // Anything else (e.g. refusal, max_tokens) means the text is missing or incomplete
  if (message.stop_reason !== 'end_turn') {
    throw new Error(`Claude stopped early: ${message.stop_reason} (request ${message._request_id})`);
  }

  // Select by type, because thinking blocks can come before the text
  return message.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('');
}
