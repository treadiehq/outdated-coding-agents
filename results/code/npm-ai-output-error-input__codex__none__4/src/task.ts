import { isToolUIPart, type UIMessage } from 'ai';

export interface FailedToolCall {
  toolCallId: string;
  input: unknown;
  errorText: string;
}

/** Extract failed static and dynamic tool calls in message order. */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  const failures: FailedToolCall[] = [];

  for (const part of message.parts) {
    if (!isToolUIPart(part) || part.state !== 'output-error') continue;

    // Older persisted static tool parts may store invalid input in rawInput.
    const input =
      part.input === undefined && 'rawInput' in part
        ? part.rawInput
        : part.input;

    failures.push({
      toolCallId: part.toolCallId,
      input,
      errorText: part.errorText,
    });
  }

  return failures;
}
