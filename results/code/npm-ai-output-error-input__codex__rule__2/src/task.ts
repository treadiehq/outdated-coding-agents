import { isToolUIPart, type UIMessage } from 'ai';

export interface FailedToolCall {
  toolCallId: string;
  input: unknown;
  errorText: string;
}

/** Extract failures from both static and dynamic tool parts. */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  const failures: FailedToolCall[] = [];

  for (const part of message.parts) {
    if (isToolUIPart(part) && part.state === 'output-error') {
      failures.push({
        toolCallId: part.toolCallId,
        input: part.input,
        errorText: part.errorText,
      });
    }
  }

  return failures;
}
