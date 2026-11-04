import OpenAI from "openai";

/**
 * Generate a PNG and return its base64-encoded contents.
 * Call on the server with a customer obtained from the authenticated session.
 * The ID must be a stable, opaque internal ID, rather than an email or username.
 * Uses OPENAI_API_KEY from the server environment.
 */
export async function generateImageForCustomer(
  prompt: string,
  customer: { readonly id: string },
): Promise<string> {
  if (!customer?.id?.trim() || customer.id.length > 128) {
    throw new Error("A signed-in customer ID of 1–128 characters is required.");
  }
  if (!prompt.trim()) {
    throw new Error("An image prompt is required.");
  }

  const client = new OpenAI();
  const response = await client.images.generate({
    model: "gpt-image-2.5-sunburst",
    prompt,
    n: 1,
    output_format: "png",
    // Current Images API attribution field; `user` is deprecated.
    safety_identifier: customer.id,
  });

  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error("OpenAI returned no image data.");
  }
  return image;
}
