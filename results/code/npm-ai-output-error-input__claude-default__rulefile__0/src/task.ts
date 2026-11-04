import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  /** May be `undefined` if the tool failed before its input was available. */
  input: unknown;
  errorText: string;
};

export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  return message.parts.flatMap(part =>
    isToolOutputErrorUIPart(part)
      ? [
          {
            toolCallId: part.toolCallId,
            input: part.input,
            errorText: part.errorText,
          },
        ]
      : [],
  );
}
