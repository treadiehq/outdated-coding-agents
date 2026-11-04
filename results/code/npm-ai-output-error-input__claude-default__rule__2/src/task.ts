import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export interface FailedToolCall {
  toolCallId: string;
  /** The arguments the model passed to the tool. `undefined` if none were captured. */
  input: unknown;
  errorText: string;
}

/**
 * Returns the tool call ID, input, and error text of each failed tool part in
 * the message, in message order.
 */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  return message.parts.filter(isToolOutputErrorUIPart).map(part => ({
    toolCallId: part.toolCallId,
    input: part.input,
    errorText: part.errorText,
  }));
}
