import OpenAI from "openai";

const client = new OpenAI();

/**
 * Generates an image on behalf of a signed-in customer and returns it as a
 * base64-encoded string.
 *
 * `customerId` is sent as `safety_identifier` so OpenAI can attribute abusive
 * requests to that customer. It must be a stable ID that doesn't reveal personal
 * details; hash it first if it contains a username or email address.
 */
export async function generateImage(prompt: string, customerId: string): Promise<string> {
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
