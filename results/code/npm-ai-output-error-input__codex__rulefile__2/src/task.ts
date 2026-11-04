import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export interface FailedToolCall {
  toolCallId: string;
  input: unknown;
  errorText: string;
}

/** Extracts failed static and dynamic tool calls in message order. */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  const failures: FailedToolCall[] = [];

  for (const part of message.parts) {
    if (!isToolOutputErrorUIPart(part)) continue;

    failures.push({
      toolCallId: part.toolCallId,
      // Current messages use input; retain the SDK's legacy fallback.
      input: part.input ?? ('rawInput' in part ? part.rawInput : undefined),
      errorText: part.errorText,
    });
  }

  return failures;
}
