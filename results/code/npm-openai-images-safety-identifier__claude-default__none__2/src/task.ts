import OpenAI from 'openai';

const client = new OpenAI();

// OpenAI asks for a stable identifier that doesn't reveal who the customer is,
// so send a hash. Hash a customer's ID the same way to look up flagged requests.
async function toSafetyIdentifier(customerId: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(customerId));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates an image for a signed-in customer and returns it base64-encoded.
 */
export async function generateImage(prompt: string, customerId: string): Promise<string> {
  if (!customerId) {
    throw new Error('customerId is required to attribute image generation requests');
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
