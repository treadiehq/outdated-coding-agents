import { isToolUIPart, type UIMessage } from 'ai';

export interface FailedToolCall {
  toolCallId: string;
  args: unknown;
  errorText: string;
}

/** Extracts failed static and dynamic tool calls in message order. */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  const failures: FailedToolCall[] = [];

  for (const part of message.parts) {
    if (!isToolUIPart(part) || part.state !== 'output-error') continue;

    // Older static tool input failures store the arguments in rawInput.
    const args =
      part.input === undefined && 'rawInput' in part
        ? part.rawInput
        : part.input;

    failures.push({
      toolCallId: part.toolCallId,
      args,
      errorText: part.errorText,
    });
  }

  return failures;
}
