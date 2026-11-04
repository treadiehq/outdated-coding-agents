import OpenAI from 'openai';

const client = new OpenAI(); // reads OPENAI_API_KEY from the environment

/**
 * Generates an image for a signed-in customer and returns it as base64 data.
 *
 * `customerId` is sent as `safety_identifier` (the current replacement for the
 * deprecated `user` parameter) so OpenAI can attribute abusive requests to the
 * customer. Pass a stable, unique ID, and avoid raw emails or other PII.
 */
export async function generateImage(prompt: string, customerId: string): Promise<string> {
  if (!customerId) {
    throw new Error('customerId is required to generate an image');
  }

  const response = await client.images.generate({
    model: 'gpt-image-2',
    prompt,
    size: '1024x1024',
    safety_identifier: customerId,
  });

  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error('Image generation returned no image data');
  }
  return image;
}
