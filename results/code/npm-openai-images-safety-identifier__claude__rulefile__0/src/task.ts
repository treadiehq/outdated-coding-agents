import { createHash } from "node:crypto";
import OpenAI from "openai";

const client = new OpenAI(); // reads OPENAI_API_KEY from the environment

/**
 * Generates an image for a signed-in customer.
 *
 * The customer ID is sent as `safety_identifier` (the current replacement for the
 * deprecated `user` parameter) so OpenAI can attribute abusive requests to that
 * customer. It is hashed so no raw identifying data leaves our systems; the hash is
 * stable, so the same customer always maps to the same identifier.
 *
 * Returns the image as a base64-encoded string.
 */
export async function generateImage(prompt: string, customerId: string): Promise<string> {
  if (!customerId) {
    throw new Error("customerId is required to generate an image");
  }

  const safetyIdentifier = createHash("sha256").update(customerId).digest("hex");

  const response = await client.images.generate({
    model: "gpt-image-2",
    prompt,
    n: 1,
    size: "1024x1024",
    safety_identifier: safetyIdentifier,
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("Image generation returned no image data");
  }
  return b64;
}
