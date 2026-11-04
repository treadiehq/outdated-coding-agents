import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  /** Undefined when the failure happened before the input was available. */
  input: unknown;
  errorText: string;
};

export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  return message.parts
    .filter(isToolOutputErrorUIPart)
    .map(({ toolCallId, input, errorText }) => ({
      toolCallId,
      input,
      errorText,
    }));
}
