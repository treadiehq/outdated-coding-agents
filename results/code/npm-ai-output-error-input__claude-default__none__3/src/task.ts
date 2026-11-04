import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  /**
   * The arguments the model passed. May not match the tool's input schema,
   * since a call that fails input validation is also reported as an error.
   */
  input: unknown;
  errorText: string;
};

/**
 * Returns the tool call ID, input, and error text of each failed tool part
 * (static or dynamic) in the message, in message order.
 */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  return message.parts.flatMap(part =>
    isToolOutputErrorUIPart(part)
      ? [
          {
            toolCallId: part.toolCallId,
            // Messages persisted by older SDK versions may only have the
            // deprecated `rawInput` field on failed parts.
            input: part.input ?? ('rawInput' in part ? part.rawInput : undefined),
            errorText: part.errorText,
          },
        ]
      : [],
  );
}
