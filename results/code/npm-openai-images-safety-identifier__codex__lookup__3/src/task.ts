import OpenAI from "openai";

/**
 * Generate a PNG and return its base64-encoded contents.
 * Call on the server with OPENAI_API_KEY configured. The customer must come from
 * the verified sign-in session, never from a customer-supplied request field.
 * Use a stable, opaque customer ID rather than an email address or username.
 * See https://developers.openai.com/api/docs/guides/image-generation
 */
export async function generateImageForCustomer(
  prompt: string,
  customer: { readonly id: string },
  client?: OpenAI,
): Promise<string> {
  if (!customer?.id?.trim()) {
    throw new Error("A signed-in customer ID is required.");
  }
  if (!prompt.trim()) {
    throw new Error("An image prompt is required.");
  }

  const result = await (client ?? new OpenAI()).images.generate({
    model: "gpt-image-2.5-sunburst",
    prompt,
    // `user` is deprecated; this identifier attributes abuse to the customer.
    safety_identifier: customer.id,
    n: 1,
    output_format: "png",
  });

  const image = result.data?.[0]?.b64_json;
  if (!image) {
    throw new Error("OpenAI returned no image data.");
  }
  return image;
}
