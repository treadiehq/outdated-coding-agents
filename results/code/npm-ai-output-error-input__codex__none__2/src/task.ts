import { isToolUIPart, type UIMessage } from 'ai';

export interface FailedToolCall {
  toolCallId: string;
  input: unknown;
  errorText: string;
}

/** Returns failed static and dynamic tool calls in message order. */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  const failures: FailedToolCall[] = [];

  for (const part of message.parts) {
    if (!isToolUIPart(part) || part.state !== 'output-error') continue;

    failures.push({
      toolCallId: part.toolCallId,
      // Older static tool errors may keep invalid arguments in rawInput.
      input:
        part.input === undefined && 'rawInput' in part
          ? part.rawInput
          : part.input,
      errorText: part.errorText,
    });
  }

  return failures;
}
