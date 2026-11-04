import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export interface FailedToolCall {
  toolCallId: string;
  /** May be undefined, e.g. when the model's input could not be parsed. */
  input: unknown;
  errorText: string;
}

/**
 * Returns the tool call ID, model-provided arguments, and error text of each
 * failed tool part (static or dynamic) in the message, in message order.
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
