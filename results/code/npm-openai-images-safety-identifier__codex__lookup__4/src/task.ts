import OpenAI from "openai";

/**
 * Call on the server with the customer's opaque ID from the verified session,
 * never an ID supplied by the request body. Requires OPENAI_API_KEY.
 * Returns a base64-encoded PNG.
 * @see https://developers.openai.com/api/reference/resources/images/methods/generate
 */
export async function generateImageForCustomer(
  prompt: string,
  customerId: string,
): Promise<string> {
  if (!customerId.trim() || customerId.length > 128) {
    throw new Error("A signed-in customer ID of 1–128 characters is required.");
  }
  if (!prompt.trim() || prompt.length > 32000) {
    throw new Error("The image prompt must contain 1–32000 characters.");
  }

  const client = new OpenAI();
  const result = await client.images.generate({
    model: "gpt-image-2.5-sunburst",
    prompt,
    // Use a stable, non-identifying account ID, rather than an email or name.
    safety_identifier: customerId,
    n: 1,
    output_format: "png",
  });

  const image = result.data?.[0]?.b64_json;
  if (!image) {
    throw new Error("OpenAI returned no image.");
  }
  return image;
}
