import { createHash } from "node:crypto";
import OpenAI from "openai";

const client = new OpenAI(); // reads OPENAI_API_KEY from the environment

// OpenAI recommends hashing the identifier so no raw customer data is sent.
// The hash is stable, so a flagged identifier can be mapped back to a customer.
function safetyIdentifier(customerId: string): string {
  return createHash("sha256").update(customerId).digest("hex");
}

/**
 * Generates an image for a signed-in customer and returns it as a Buffer (PNG).
 * The customer's ID is sent as `safety_identifier` (the current replacement for
 * the deprecated `user` parameter) so OpenAI can attribute abusive requests.
 */
export async function generateImage(
  prompt: string,
  customerId: string,
): Promise<Buffer> {
  if (!customerId) {
    throw new Error("A signed-in customer ID is required to generate images.");
  }

  const response = await client.images.generate({
    model: "gpt-image-2",
    prompt,
    size: "1024x1024",
    output_format: "png",
    safety_identifier: safetyIdentifier(customerId),
  });

  // GPT image models always return base64-encoded data (no `url`).
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("Image generation returned no image data.");
  }
  return Buffer.from(b64, "base64");
}
