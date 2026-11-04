import OpenAI from "openai";

/**
 * Run on the server with OPENAI_API_KEY configured.
 * customerId must be the stable, opaque ID from your verified sign-in session,
 * rather than a client-supplied ID, email address, or display name.
 * Returns the generated PNG as a base64-encoded string.
 */
export async function generateImage(
  prompt: string,
  customerId: string,
): Promise<string> {
  if (!prompt.trim()) {
    throw new Error("A nonempty image prompt is required.");
  }
  if (!customerId.trim() || customerId.length > 128) {
    throw new Error("A customer ID between 1 and 128 characters is required.");
  }

  const client = new OpenAI();
  const result = await client.images.generate({
    model: "gpt-image-1.5",
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
