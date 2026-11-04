import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  /** The arguments the model passed. `undefined` if the part has no input. */
  input: unknown;
  errorText: string;
};

/**
 * Returns the tool call ID, input, and error text of each failed tool part
 * (static or dynamic) in the message, in part order.
 */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  return message.parts.filter(isToolOutputErrorUIPart).map(part => ({
    toolCallId: part.toolCallId,
    input: part.input,
    errorText: part.errorText,
  }));
}
