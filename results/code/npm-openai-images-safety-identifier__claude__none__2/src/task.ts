import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface GenerateImageOptions {
  size?: "1024x1024" | "1536x1024" | "1024x1536" | "auto";
  model?: string;
}

/**
 * Generates an image from a prompt on behalf of a signed-in customer.
 * The customer's ID is sent as the `user` parameter so OpenAI can attribute
 * abusive requests to that customer.
 *
 * Returns the image as a base64-encoded string.
 */
export async function generateImage(
  prompt: string,
  customerId: string,
  options: GenerateImageOptions = {},
): Promise<string> {
  if (!customerId) {
    throw new Error("customerId is required to generate an image");
  }

  const response = await client.images.generate({
    model: options.model ?? "gpt-image-1",
    prompt,
    size: options.size ?? "1024x1024",
    n: 1,
    user: customerId,
  });

  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error("OpenAI returned no image data");
  }
  return image;
}
