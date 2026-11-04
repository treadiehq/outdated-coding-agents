/** Ask Haiku a hard question and return its final answer without thinking blocks.
 * Pass an Anthropic API key from your server's secret store.
 * API docs: https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide
 */
export async function askHaiku(
  apiKey: string,
  question: string = "There are 100 prisoners and 100 boxes containing a random permutation of their numbers. Each prisoner may open 50 boxes, with no communication after the search begins. What strategy maximizes the probability that every prisoner finds their own number, and what is the exact success probability? Justify the result.",
): Promise<string> {
  if (!apiKey.trim()) throw new Error("An Anthropic API key is required.");
  if (!question.trim()) throw new Error("A question is required.");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2026-10-21",
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic Messages API failed (HTTP ${response.status}).`);
  }

  const message: unknown = await response.json();
  if (typeof message !== "object" || message === null) {
    throw new Error("Invalid Anthropic Messages API response.");
  }
  if (!("stop_reason" in message) || message.stop_reason !== "end_turn") {
    const reason = "stop_reason" in message ? String(message.stop_reason) : "missing";
    throw new Error(`Claude did not complete an answer (stop_reason: ${reason}).`);
  }
  if (!("content" in message) || !Array.isArray(message.content)) {
    throw new Error("Anthropic response has no content blocks.");
  }

  const answer = message.content
    .filter(
      (block): block is { type: "text"; text: string } =>
        typeof block === "object" &&
        block !== null &&
        block.type === "text" &&
        typeof block.text === "string",
    )
    .map((block) => block.text)
    .join("")
    .trim();

  if (!answer) throw new Error("Claude returned no final answer text.");
  return answer;
}
