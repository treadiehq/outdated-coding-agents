import OpenAI from "openai";

/**
 * Call on the server with the customer's stable, opaque ID from a verified
 * sign-in session, never an ID supplied in the request body.
 * Requires OPENAI_API_KEY in the server environment.
 */
export async function generateImage(prompt: string, customerId: string) {
  if (!customerId.trim() || customerId.length > 128) {
    throw new Error("A customer ID between 1 and 128 characters is required.");
  }
  if (!prompt.trim()) {
    throw new Error("An image prompt is required.");
  }

  const client = new OpenAI();
  return client.images.generate({
    model: "gpt-image-2.5-flare",
    prompt,
    n: 1,
    // Current attribution field; the older `user` parameter is deprecated.
    safety_identifier: customerId,
  });
}
