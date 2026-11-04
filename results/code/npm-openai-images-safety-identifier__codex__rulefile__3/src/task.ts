import OpenAI from "openai";

/**
 * Run on the server with OPENAI_API_KEY set. Supply customerId from the
 * authenticated session, never from an untrusted request body. Use an opaque
 * internal customer ID rather than an email address or other personal data.
 * Returns a base64-encoded PNG.
 */
export async function generateImageForCustomer(
  prompt: string,
  customerId: string,
): Promise<string> {
  if (!customerId.trim() || customerId.length > 128) {
    throw new Error("A signed-in customer ID of 1–128 characters is required.");
  }
  if (!prompt.trim()) {
    throw new Error("An image prompt is required.");
  }

  const client = new OpenAI();
  const response = await client.images.generate({
    model: "gpt-image-2.5-flare",
    prompt,
    // Current attribution field; the legacy `user` parameter is deprecated.
    safety_identifier: customerId,
    n: 1,
    output_format: "png",
  });

  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error("OpenAI returned no image data.");
  }
  return image;
}
