import { createHash } from "node:crypto";
import OpenAI from "openai";

const client = new OpenAI(); // reads OPENAI_API_KEY from the environment

export interface GenerateImageOptions {
  size?: "1024x1024" | "1536x1024" | "1024x1536" | "auto";
  quality?: "low" | "medium" | "high" | "auto";
}

/**
 * Generates an image for a signed-in customer and returns it as a Buffer (PNG).
 *
 * The customer ID is sent as `safety_identifier` (the current replacement for the
 * deprecated `user` param) so OpenAI can attribute abusive requests to that customer.
 * It is hashed so no raw identifying information leaves our systems.
 */
export async function generateImage(
  prompt: string,
  customerId: string,
  options: GenerateImageOptions = {},
): Promise<Buffer> {
  if (!customerId) {
    throw new Error("customerId is required to generate an image");
  }

  const response = await client.images.generate({
    model: "gpt-image-2",
    prompt,
    n: 1,
    size: options.size ?? "1024x1024",
    quality: options.quality ?? "auto",
    safety_identifier: createHash("sha256").update(customerId).digest("hex"),
  });

  // GPT image models always return base64-encoded image data.
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("Image generation returned no image data");
  }
  return Buffer.from(b64, "base64");
}
