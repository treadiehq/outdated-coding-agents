const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2026-10-21";
const MODEL = "claude-haiku-5-5";
// Thinking tokens count toward max_tokens, so leave room for them and the answer.
const MAX_TOKENS = 16000;

const HARD_QUESTION =
  "A fair coin is flipped repeatedly until either the sequence HHT or the " +
  "sequence HTH appears. What is the exact probability that HHT appears first?";

type ContentBlock = { type: "text"; text: string } | { type: string };

interface MessageResponse {
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
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": API_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error ${response.status}: ${await response.text()}`);
  }

  const message = (await response.json()) as MessageResponse;

  if (message.stop_reason === "refusal") {
    throw new Error("Claude declined to answer the question");
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error(`Response hit the ${MAX_TOKENS} max_tokens limit before finishing`);
  }

  // Responses can start with thinking blocks, so select the answer by type.
  const answer = message.content
    .filter(isTextBlock)
    .map((block) => block.text)
    .join("");

  if (!answer) {
    throw new Error(`Response contained no text (stop_reason: ${message.stop_reason})`);
  }
  return answer;
}
