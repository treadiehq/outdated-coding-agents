import OpenAI from 'openai';

const client = new OpenAI();

async function toSafetyIdentifier(customerId: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(customerId));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates an image for a signed-in customer and returns it base64-encoded.
 *
 * The customer ID is sent as a SHA-256 hash, so OpenAI can flag abuse by a stable
 * identifier without receiving the ID itself. To attribute a flagged identifier,
 * hash your customer IDs the same way and look for the match.
 */
export async function generateImage(prompt: string, customerId: string): Promise<string> {
  if (!customerId) {
    throw new Error('customerId is required');
  }

  const response = await client.images.generate({
    model: 'gpt-image-2',
    prompt,
    safety_identifier: await toSafetyIdentifier(customerId),
  });

  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error('OpenAI returned no image data');
  }
  return image;
}
