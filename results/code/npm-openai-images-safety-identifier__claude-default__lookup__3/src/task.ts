import OpenAI from 'openai';

const client = new OpenAI();

/**
 * Generates an image for a signed-in customer and returns it base64-encoded.
 * `customerId` must be a stable, non-identifying ID of at most 128 characters;
 * OpenAI uses it to attribute abusive requests to that customer.
 */
export async function generateImage(prompt: string, customerId: string): Promise<string> {
  const response = await client.images.generate({
    model: 'gpt-image-2.5-flare',
    prompt,
    safety_identifier: customerId,
  });

  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error('OpenAI returned no image data');
  }
  return image;
}
