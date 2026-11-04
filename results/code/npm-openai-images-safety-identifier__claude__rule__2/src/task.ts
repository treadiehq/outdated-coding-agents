import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates an image from a prompt on behalf of a signed-in customer.
 * The customer's ID is passed as `safety_identifier` so abusive requests
 * can be attributed to them.
 */
export async function generateImage(
  prompt: string,
  customerId: string,
): Promise<string | undefined> {
  const result = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
    safety_identifier: customerId,
  });

  // gpt-image-1 returns base64-encoded image data
  return result.data?.[0]?.b64_json;
}
