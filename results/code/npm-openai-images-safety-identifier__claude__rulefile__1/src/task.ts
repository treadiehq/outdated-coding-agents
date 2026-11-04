import OpenAI from "openai";

const client = new OpenAI(); // reads OPENAI_API_KEY from the environment

/**
 * Generates an image for a signed-in customer and returns it as base64.
 *
 * `customerId` is sent as `safety_identifier` so OpenAI can attribute abusive
 * requests to this customer. It should be a stable, opaque ID (not an email or
 * username); hash it first if it is not.
 */
export async function generateImage(
  prompt: string,
  customerId: string,
): Promise<string> {
  if (!customerId) {
    throw new Error("A signed-in customer ID is required to generate images");
  }

  const response = await client.images.generate({
    model: "gpt-image-2",
    prompt,
    n: 1,
    size: "1024x1024",
    safety_identifier: customerId,
  });

  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error("Image generation returned no image data");
  }
  return image;
}
