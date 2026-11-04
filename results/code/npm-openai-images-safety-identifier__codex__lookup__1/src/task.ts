import OpenAI from "openai";

/**
 * Run on the server with OPENAI_API_KEY configured. Pass the customer ID from
 * the verified sign-in session, never from an untrusted request body.
 * Returns a base64-encoded PNG.
 */
export async function generateImageForCustomer(
  prompt: string,
  customerId: string,
): Promise<string> {
  if (!prompt.trim()) {
    throw new Error("A non-empty image prompt is required.");
  }
  if (!customerId.trim() || customerId.length > 128) {
    throw new Error("A customer ID of 1–128 characters is required.");
  }

  const client = new OpenAI();
  const result = await client.images.generate({
    model: "gpt-image-2.5-flare",
    prompt,
    // Current abuse-attribution field; the legacy `user` field is deprecated.
    // Use a stable internal customer ID that contains no personal information.
    safety_identifier: customerId,
    n: 1,
    output_format: "png",
  });

  const image = result.data?.[0]?.b64_json;
  if (!image) {
    throw new Error("OpenAI returned no image data.");
  }
  return image;
}
