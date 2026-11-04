import { createHash } from "node:crypto";
import OpenAI from "openai";

/**
 * Run on the server with OPENAI_API_KEY set. Pass the customer ID from your
 * verified authentication session, never from an untrusted request body.
 * Returns a base64-encoded PNG.
 */
export async function generateImageForCustomer(
  prompt: string,
  customerId: string,
): Promise<string> {
  if (!customerId?.trim()) {
    throw new Error("A signed-in customer ID is required.");
  }
  if (!prompt?.trim()) {
    throw new Error("An image prompt is required.");
  }

  // A stable hash allows abuse attribution without sending the raw customer ID.
  // https://developers.openai.com/api/reference/resources/images/methods/generate
  const safetyIdentifier = createHash("sha256")
    .update(customerId)
    .digest("hex");

  const client = new OpenAI();
  const result = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    safety_identifier: safetyIdentifier,
    n: 1,
    output_format: "png",
  });

  const image = result.data?.[0]?.b64_json;
  if (!image) {
    throw new Error("OpenAI returned no image data.");
  }
  return image;
}
