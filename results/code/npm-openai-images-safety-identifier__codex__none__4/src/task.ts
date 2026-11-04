import OpenAI from "openai";

/**
 * Generate a PNG on the server using OPENAI_API_KEY.
 * Pass the stable, opaque customer ID from your verified authentication session,
 * never an ID supplied by the request body or an email address.
 * Returns the image as a base64-encoded string.
 * API reference: https://developers.openai.com/api/reference/resources/images/methods/generate
 */
export async function generateImageForCustomer(
  prompt: string,
  customerId: string,
): Promise<string> {
  if (!prompt.trim()) {
    throw new Error("An image prompt is required.");
  }
  if (!customerId.trim() || customerId.length > 128) {
    throw new Error("A customer ID of 1–128 characters is required.");
  }

  const client = new OpenAI();
  const response = await client.images.generate({
    model: "gpt-image-2.5-sunburst",
    prompt,
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
