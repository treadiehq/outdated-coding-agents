import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  /** May be malformed or undefined, because tool input can fail validation or parsing. */
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
