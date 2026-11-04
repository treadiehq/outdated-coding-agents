import { createHash } from "node:crypto";
import OpenAI from "openai";

const client = new OpenAI(); // reads OPENAI_API_KEY from the environment

/**
 * Generates an image for a signed-in customer and returns it as a base64 string.
 *
 * `customerId` is sent as `safety_identifier` (the current replacement for the
 * deprecated `user` parameter) so OpenAI can attribute abusive requests to this
 * customer. It is hashed so no raw identifier leaves your system; the hash is
 * stable, so you can recompute it from your own customer ID when OpenAI reports
 * abuse.
 */
export async function generateImage(
  customerId: string,
  prompt: string,
): Promise<string> {
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
    throw new Error("OpenAI returned no image data");
  }
  return b64;
}
