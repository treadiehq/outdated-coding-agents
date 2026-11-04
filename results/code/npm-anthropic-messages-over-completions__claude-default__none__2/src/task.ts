import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function generateText(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  });

  // Without tools or stop sequences, any other stop reason (such as a refusal or
  // hitting max_tokens) means the text is missing or incomplete.
  if (message.stop_reason !== 'end_turn') {
    throw new Error(`Claude did not finish its response: ${message.stop_reason}`);
  }

  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');
}
