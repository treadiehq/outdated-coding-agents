import OpenAI from "openai";

/**
 * Generate an image on the server using OPENAI_API_KEY.
 * Pass the stable, opaque customer ID from the verified sign-in session,
 * never an ID supplied by the request body or an email address.
 * Returns a base64-encoded PNG.
 */
export async function generateImage(
  prompt: string,
  customerId: string,
): Promise<string> {
  if (!customerId.trim()) {
    throw new Error("A signed-in customer ID is required.");
  }
  if (!prompt.trim()) {
    throw new Error("An image prompt is required.");
  }

  const client = new OpenAI();
  const response = await client.images.generate({
    model: "gpt-image-2.5-sunburst",
    prompt,
    // Current attribution field; replaces the deprecated `user` parameter.
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
