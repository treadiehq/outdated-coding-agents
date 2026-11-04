import OpenAI from 'openai';

const client = new OpenAI();

/**
 * Derives a stable identifier from a customer ID, so OpenAI can attribute abuse to
 * one customer without receiving the ID itself. Hashing the same ID again gives the
 * same value, which lets you match a flagged identifier back to your customer.
 */
async function toSafetyIdentifier(customerId: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(customerId));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates an image for a signed-in customer and returns it as a base64-encoded PNG.
 */
export async function generateImage(prompt: string, customerId: string): Promise<string> {
  if (!customerId) {
    throw new Error('customerId is required');
  }

  const response = await client.images.generate({
    model: 'gpt-image-2.5-flare',
    prompt,
    safety_identifier: await toSafetyIdentifier(customerId),
  });

  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error('OpenAI returned no image data');
  }
  return image;
}
