interface MessageResponse {
  content: Array<{ type: string; text?: string }>;
  stop_reason: string | null;
}

export async function askHardQuestion(question: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2026-10-21",
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      // Thinking tokens count toward max_tokens, so leave room for the answer too.
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error ${response.status}: ${await response.text()}`);
  }

  const message = (await response.json()) as MessageResponse;

  // Refusals arrive as HTTP 200, and truncation can leave thinking with no text.
  if (message.stop_reason !== "end_turn") {
    throw new Error(`Claude did not finish its answer: stop_reason=${message.stop_reason}`);
  }

  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
}
