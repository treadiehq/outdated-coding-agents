import OpenAI from "openai";

const client = new OpenAI(); // reads OPENAI_API_KEY from the environment

/**
 * Generates an image from a prompt on behalf of a signed-in customer.
 * The customer's ID is sent as the `user` parameter so OpenAI can attribute
 * abusive requests to that customer.
 *
 * Returns the image as a base64-encoded string.
 */
export async function generateImage(prompt: string, customerId: string): Promise<string> {
  if (!customerId) {
    throw new Error("customerId is required to generate an image");
  }

  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1024",
    user: customerId,
  });

  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error("Image generation returned no image data");
  }
  return image;
}
