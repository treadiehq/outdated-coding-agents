import OpenAI from 'openai';

const client = new OpenAI();

/**
 * Generates an image for a signed-in customer and returns it base64-encoded.
 *
 * `customerId` is sent as the safety identifier, so it must be a stable, opaque
 * ID. Hash it first if it contains an email address or username.
 */
export async function generateImage(prompt: string, customerId: string): Promise<string> {
  const response = await client.images.generate({
    model: 'gpt-image-2.5-sunburst',
    prompt,
    safety_identifier: customerId,
  });

  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error('OpenAI returned no image data');
  }
  return image;
}
