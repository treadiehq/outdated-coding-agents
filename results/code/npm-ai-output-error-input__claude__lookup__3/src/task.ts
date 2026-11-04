import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  /** Arguments the model passed to the tool (`undefined` if they could not be parsed). */
  input: unknown;
  errorText: string;
};

/**
 * Returns the tool call ID, the model-supplied input and the error text for
 * every tool part (static or dynamic) in the message that ended in the
 * `output-error` state.
 */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  return message.parts.filter(isToolOutputErrorUIPart).map(part => ({
    toolCallId: part.toolCallId,
    input: part.input,
    errorText: part.errorText,
  }));
}
