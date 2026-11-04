import { createHash } from 'node:crypto';
import OpenAI from 'openai';

const client = new OpenAI(); // reads OPENAI_API_KEY from the environment

/**
 * Generates an image for a signed-in customer and returns it as a base64 string.
 *
 * The customer's ID is sent as `safety_identifier` (the replacement for the
 * deprecated `user` param) so OpenAI can attribute abusive requests to them.
 * It is hashed so the raw internal ID is not sent to OpenAI.
 */
export async function generateImage(customerId: string, prompt: string): Promise<string> {
  if (!customerId) {
    throw new Error('customerId is required');
  }

  const response = await client.images.generate({
    model: 'gpt-image-1.5',
    prompt,
    size: '1024x1024',
    safety_identifier: createHash('sha256').update(customerId).digest('hex'),
  });

  // GPT image models always return base64-encoded images.
  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error('Image generation returned no image data');
  }
  return image;
}
