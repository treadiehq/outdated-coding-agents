import { createHash } from 'node:crypto';
import OpenAI from 'openai';

const client = new OpenAI(); // reads OPENAI_API_KEY from the environment

/**
 * Generates an image for a signed-in customer and returns it as base64.
 *
 * The customer's ID is sent as `safety_identifier` (the current replacement for
 * the deprecated `user` parameter) so OpenAI can attribute abusive requests to
 * that customer. It is hashed so the raw ID is not sent; the hash is stable, so
 * you can recompute it from a customer ID to match a report from OpenAI.
 */
export async function generateImage(prompt: string, customerId: string): Promise<string> {
  if (!customerId) {
    throw new Error('customerId is required to generate an image');
  }

  const response = await client.images.generate({
    model: 'gpt-image-1',
    prompt,
    n: 1,
    size: '1024x1024',
    safety_identifier: createHash('sha256').update(customerId).digest('hex'),
  });

  // GPT image models always return base64-encoded images.
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('Image generation returned no image data');
  }
  return b64;
}
