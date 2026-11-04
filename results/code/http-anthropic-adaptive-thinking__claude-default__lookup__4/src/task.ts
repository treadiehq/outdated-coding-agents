const HARD_QUESTION =
  "Are there infinitely many prime numbers p such that p mod 4 == 3? Give a rigorous proof.";

type ContentBlock = { type: "text"; text: string } | { type: string };

interface MessagesResponse {
  content: ContentBlock[];
  stop_reason: string | null;
}

function isTextBlock(block: ContentBlock): block is { type: "text"; text: string } {
  return block.type === "text";
}

export async function askHardQuestion(
  apiKey: string,
  question: string = HARD_QUESTION,
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2026-10-21",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      // Thinking counts toward max_tokens, so leave room for it and the answer.
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

  // Anything else (refusal, max_tokens, ...) means there is no complete answer to return.
  if (message.stop_reason !== "end_turn") {
    throw new Error(`No complete answer: stop_reason was ${message.stop_reason}`);
  }

  const answer = message.content
    .filter(isTextBlock)
    .map((block) => block.text)
    .join("");

  if (!answer) {
    throw new Error("No answer: the response contained no text");
  }

  return answer;
}
