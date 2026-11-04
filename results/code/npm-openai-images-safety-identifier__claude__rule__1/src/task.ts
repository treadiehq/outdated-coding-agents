import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates an image from a prompt on behalf of a signed-in customer.
 * The customer's ID is passed as `safety_identifier` so abusive requests
 * can be attributed to them.
 *
 * Returns the image as a base64-encoded string.
 */
export async function generateImage(
  prompt: string,
  customerId: string,
): Promise<string> {
  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
    safety_identifier: customerId,
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("Image generation returned no image data");
  }
  return b64;
}
