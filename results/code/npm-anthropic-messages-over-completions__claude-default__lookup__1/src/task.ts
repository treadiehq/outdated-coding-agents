import Anthropic from '@anthropic-ai/sdk';

// Reads ANTHROPIC_API_KEY from the environment.
const client = new Anthropic();

export async function generateText(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-opus-5-5',
    // Thinking is always on for this model and counts toward max_tokens, so leave room for both.
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  });

  if (message.stop_reason === 'refusal') {
    throw new Error('Claude refused to respond to the prompt');
  }
  if (message.stop_reason === 'max_tokens') {
    throw new Error('Claude response was truncated at max_tokens');
  }

  // content can also hold non-text blocks such as thinking, so keep only the text.
  return message.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('');
}
