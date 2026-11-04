interface MessagesResponse {
  content: Array<{ type: string; text?: string }>;
  stop_reason: string | null;
  stop_details?: { category?: string | null } | null;
}

export async function askHaiku(question: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2026-10-21",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      // Thinking tokens count toward max_tokens, so leave room for both.
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Messages API error ${response.status}: ${await response.text()}`);
  }

  const message = (await response.json()) as MessagesResponse;

  // Refusals and truncation arrive as HTTP 200, so check before using the text.
  if (message.stop_reason !== "end_turn") {
    const category = message.stop_details?.category;
    throw new Error(
      `Claude did not finish: stop_reason=${message.stop_reason}` +
        (category ? `, category=${category}` : ""),
    );
  }

  // Thinking blocks can precede the answer, so select by type, not position.
  const answer = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");

  if (!answer) {
    throw new Error("Claude returned no answer text");
  }

  return answer;
}
