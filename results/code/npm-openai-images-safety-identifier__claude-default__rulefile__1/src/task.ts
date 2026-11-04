import OpenAI from "openai";

const client = new OpenAI();

/**
 * Generates an image for a signed-in customer and returns it base64-encoded.
 *
 * `customerId` is sent as `safety_identifier` so OpenAI can attribute abusive
 * requests to that customer. It must be stable and must not contain identifying
 * information: hash it first if it is an email address or username.
 */
export async function generateImage(prompt: string, customerId: string): Promise<string> {
  // The API treats an empty identifier as omitted, which would lose attribution.
  if (!customerId) {
    throw new Error("customerId is required");
  }

  const response = await client.images.generate({
    model: "gpt-image-2",
    prompt,
    safety_identifier: customerId,
  });

  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error("OpenAI returned no image data");
  }
  return image;
}
