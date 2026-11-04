import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  /** Arguments the model passed to the tool. */
  input: unknown;
  errorText: string;
};

/**
 * Returns the tool call ID, the arguments the model passed, and the error text
 * for every tool part in the message that failed (state `output-error`).
 * Works for both static (`tool-*`) and dynamic tool parts.
 */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  return message.parts.filter(isToolOutputErrorUIPart).map(part => ({
    toolCallId: part.toolCallId,
    // `input` is undefined when the model's arguments failed validation; the
    // deprecated `rawInput` (static parts only) may still hold what was passed.
    input: part.input ?? ('rawInput' in part ? part.rawInput : undefined),
    errorText: part.errorText,
  }));
}
