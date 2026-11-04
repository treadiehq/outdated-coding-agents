import OpenAI from "openai";

const client = new OpenAI();

/**
 * Generates an image for a signed-in customer and returns it base64-encoded.
 *
 * `customerId` must be a stable, opaque ID. If it contains an email address or
 * username, hash it first so no identifying information is sent to OpenAI.
 */
export async function generateImage(prompt: string, customerId: string): Promise<string> {
  // The API accepts an empty identifier, which would silently lose attribution.
  if (!customerId) {
    throw new Error("customerId is required to attribute image requests");
  }

  const response = await client.images.generate({
    model: "gpt-image-2.5-sunburst",
    prompt,
    safety_identifier: customerId,
  });

  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error("OpenAI returned no image data");
  }
  return image;
}
