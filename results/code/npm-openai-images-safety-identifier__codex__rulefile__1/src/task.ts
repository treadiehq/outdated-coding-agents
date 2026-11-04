import OpenAI from "openai";

/**
 * Call on the server with the customer ID from your verified sign-in session,
 * never an ID supplied by the request body. Use an opaque internal customer ID.
 * Requires OPENAI_API_KEY in the server environment.
 * Returns a base64-encoded PNG.
 */
export async function generateImage(
  prompt: string,
  customerId: string,
): Promise<string> {
  if (!customerId?.trim()) {
    throw new Error("A signed-in customer ID is required.");
  }
  if (!prompt?.trim()) {
    throw new Error("An image prompt is required.");
  }

  const client = new OpenAI();
  const result = await client.images.generate({
    model: "gpt-image-1",
    prompt,
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
