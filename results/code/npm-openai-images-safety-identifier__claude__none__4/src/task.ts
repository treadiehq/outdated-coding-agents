import OpenAI from "openai";

const client = new OpenAI(); // reads OPENAI_API_KEY from the environment

/**
 * Generates an image for a signed-in customer.
 *
 * `customerId` is forwarded as OpenAI's `user` parameter so that abusive
 * requests can be attributed to the customer. Use a stable, opaque identifier
 * (e.g. an internal ID or a hash), not an email address or other PII.
 *
 * Returns the image as a base64-encoded PNG.
 */
export async function generateImage(
  prompt: string,
  customerId: string,
): Promise<string> {
  if (!customerId) {
    throw new Error("customerId is required to generate an image");
  }

  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1024",
    user: customerId,
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("Image generation returned no image data");
  }
  return b64;
}
