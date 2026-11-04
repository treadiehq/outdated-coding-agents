import OpenAI from "openai";

/**
 * Run on the server with OPENAI_API_KEY configured.
 * Supply the customer's stable, opaque ID from the verified sign-in session,
 * never from a client-controlled request field or an email address.
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
    model: "gpt-image-2.5-flare",
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
