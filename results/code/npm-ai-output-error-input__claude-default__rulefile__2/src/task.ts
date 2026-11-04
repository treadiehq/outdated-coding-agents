import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  /** May be undefined, since the SDK allows failed tool parts without an input. */
  input: unknown;
  errorText: string;
};

/**
 * Returns the tool call ID, input, and error text of each failed tool part
 * (static or dynamic) in the message.
 */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  const failedToolCalls: FailedToolCall[] = [];

  for (const part of message.parts) {
    if (isToolOutputErrorUIPart(part)) {
      failedToolCalls.push({
        toolCallId: part.toolCallId,
        input: part.input,
        errorText: part.errorText,
      });
    }
  }

  return failedToolCalls;
}
