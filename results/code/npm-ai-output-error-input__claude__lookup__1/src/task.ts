import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  /** Arguments the model passed to the tool. May be undefined if none were recorded. */
  input: unknown;
  errorText: string;
};

/**
 * Returns the tool call ID, input, and error text for every tool part
 * (static or dynamic) in the message that ended in the `output-error` state.
 */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  return message.parts.filter(isToolOutputErrorUIPart).map(part => ({
    toolCallId: part.toolCallId,
    input: part.input,
    errorText: part.errorText,
  }));
}
