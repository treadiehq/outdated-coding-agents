import OpenAI from 'openai';

const client = new OpenAI();

/**
 * Generates an image for a signed-in customer and returns it base64-encoded
 * (PNG by default).
 *
 * `customerId` is sent as `safety_identifier` so OpenAI can attribute abusive
 * requests to that customer. It should be a stable, opaque ID; hash it first if
 * it contains identifying information such as an email address.
 */
export async function generateImage(prompt: string, customerId: string): Promise<string> {
  // The API treats an empty identifier as absent, which would lose attribution.
  if (!customerId) {
    throw new Error('customerId is required');
  }

  const response = await client.images.generate({
    model: 'gpt-image-2',
    prompt,
    safety_identifier: customerId,
  });

  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error('OpenAI returned no image data');
  }
  return image;
}
