import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  input: unknown;
  errorText: string;
};

/**
 * Returns the tool call ID, input, and error text of each failed tool part
 * (static or dynamic) in the message.
 *
 * `input` is `undefined` if the part has no recorded arguments. It may not
 * match the tool's schema, because input validation failures are also reported
 * as failed tool parts.
 */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  return message.parts
    .filter(isToolOutputErrorUIPart)
    .map(({ toolCallId, input, errorText }) => ({
      toolCallId,
      input,
      errorText,
    }));
}
