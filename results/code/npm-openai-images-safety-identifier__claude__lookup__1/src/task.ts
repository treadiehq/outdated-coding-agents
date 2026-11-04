import OpenAI from 'openai';

const client = new OpenAI(); // reads OPENAI_API_KEY from the environment

/**
 * Generates an image from a prompt on behalf of a signed-in customer.
 * Returns the image as a base64-encoded string (GPT image models always return base64).
 *
 * `customerId` must be a stable, unique identifier for the signed-in customer
 * (e.g. your internal user ID, not something shared or anonymous). It is sent as
 * `safety_identifier` so OpenAI can attribute abusive requests to that customer.
 */
export async function generateImage(prompt: string, customerId: string): Promise<string> {
  if (!customerId) {
    throw new Error('customerId is required to attribute image generation requests');
  }

  const response = await client.images.generate({
    model: 'gpt-image-2',
    prompt,
    n: 1,
    size: '1024x1024',
    // `user` is deprecated in favor of `safety_identifier`.
    safety_identifier: customerId,
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('Image generation returned no image data');
  }
  return b64;
}
