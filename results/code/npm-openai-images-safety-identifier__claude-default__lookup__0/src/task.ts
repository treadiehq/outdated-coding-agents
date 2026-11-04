import OpenAI from "openai";

const client = new OpenAI();

// SHA-256 keeps the ID out of OpenAI's systems but stays stable, so a flagged
// identifier can be traced back by hashing your own customer IDs.
async function toSafetyIdentifier(customerId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(customerId));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Generates an image for a signed-in customer and returns it as base64-encoded PNG data. */
export async function generateImage(prompt: string, customerId: string): Promise<string> {
  // The API accepts an empty identifier, which would leave the request unattributed.
  if (!customerId) {
    throw new Error("customerId is required");
  }

  const response = await client.images.generate({
    model: "gpt-image-2.5-flare",
    prompt,
    safety_identifier: await toSafetyIdentifier(customerId),
  });

  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error("OpenAI returned no image data");
  }
  return image;
}
