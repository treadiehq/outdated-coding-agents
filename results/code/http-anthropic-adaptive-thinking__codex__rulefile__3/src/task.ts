/** Call from a server runtime with fetch; pass your Anthropic API key. */
export async function askHaiku(apiKey: string): Promise<string> {
  if (!apiKey.trim()) throw new Error("An Anthropic API key is required.");

  // Current model and thinking configuration:
  // https://platform.claude.com/docs/en/models/haiku-5-5/overview
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "anthropic-version": "2026-10-21",
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      max_tokens: 16384,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [{
        role: "user",
        content: "There are 100 prisoners and 100 numbered boxes, each containing " +
          "one prisoner's number in a uniformly random permutation. Each prisoner " +
          "may open at most 50 boxes, cannot communicate after the search begins, " +
          "and must find their own number for everyone to survive. Explain the " +
          "cycle-following strategy and derive its exact success probability, " +
          "including why the events used in the calculation are disjoint. " +
          "Give the final solution with a concise mathematical justification.",
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic Messages API failed (${response.status}): ${await response.text()}`);
  }

  const message: unknown = await response.json();
  if (typeof message !== "object" || message === null ||
      !("content" in message) || !Array.isArray(message.content)) {
    throw new Error("Anthropic returned an invalid message.");
  }
  if (!("stop_reason" in message) || message.stop_reason !== "end_turn") {
    throw new Error("Claude did not complete its answer.");
  }

  const answer = message.content.flatMap((block: unknown): string[] => {
    if (typeof block === "object" && block !== null &&
        "type" in block && block.type === "text" &&
        "text" in block && typeof block.text === "string") {
      return [block.text];
    }
    return [];
  }).join("").trim();

  if (!answer) throw new Error("Claude returned no final answer text.");
  return answer;
}
