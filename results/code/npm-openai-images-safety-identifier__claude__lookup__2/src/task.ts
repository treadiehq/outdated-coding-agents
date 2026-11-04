import { createHash } from 'node:crypto';
import OpenAI from 'openai';

const client = new OpenAI(); // reads OPENAI_API_KEY from the environment

/**
 * Generates an image from a prompt on behalf of a signed-in customer.
 * Returns the image as a base64-encoded PNG (GPT image models always return base64).
 */
export async function generateImage(prompt: string, customerId: string): Promise<string> {
  if (!customerId) {
    throw new Error('customerId is required to attribute image generation requests');
  }

  const response = await client.images.generate({
    model: 'gpt-image-2',
    prompt,
    size: '1024x1024',
    output_format: 'png',
    // `user` is deprecated; `safety_identifier` is the current way to attribute abuse.
    // Hash the ID so no identifying information is sent to OpenAI.
    safety_identifier: createHash('sha256').update(customerId).digest('hex'),
  });

  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error('Image generation returned no image data');
  }
  return image;
}
