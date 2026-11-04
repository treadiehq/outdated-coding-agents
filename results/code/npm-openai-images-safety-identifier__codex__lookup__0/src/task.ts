import OpenAI from "openai";

/**
 * Run on the server with OPENAI_API_KEY set. Supply the customer's stable,
 * opaque ID from the authenticated session, never from an untrusted request body.
 * Returns a base64-encoded PNG.
 */
export async function generateImage(
  prompt: string,
  customerId: string,
): Promise<string> {
  if (!prompt.trim()) {
    throw new Error("An image prompt is required.");
  }
  if (!customerId.trim() || customerId.length > 128) {
    throw new Error("A customer ID between 1 and 128 characters is required.");
  }

  const client = new OpenAI();
  const result = await client.images.generate({
    model: "gpt-image-2.5-sunburst",
    prompt,
    // The Images API's `user` field is deprecated; use safety_identifier.
    // https://developers.openai.com/api/docs/guides/image-generation#safety-identifiers
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
