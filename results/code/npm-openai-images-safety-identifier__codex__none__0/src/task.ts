import OpenAI from "openai";

/**
 * Call on the server with the customer's stable, opaque ID from your verified
 * sign-in session, never an ID supplied by the request body or an email address.
 * The SDK reads your server's OPENAI_API_KEY environment variable.
 * Returns the image response, including base64 image data in data[0].b64_json.
 */
export async function generateImage(prompt: string, customerId: string) {
  if (!prompt.trim()) {
    throw new Error("An image prompt is required.");
  }
  if (!customerId.trim() || customerId.length > 128) {
    throw new Error("A customer ID of 1–128 characters is required.");
  }

  const openai = new OpenAI();
  return openai.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    safety_identifier: customerId,
  });
}
