import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  input: unknown;
  errorText: string;
};

export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  const failedToolCalls: FailedToolCall[] = [];

  for (const part of message.parts) {
    if (isToolOutputErrorUIPart(part)) {
      failedToolCalls.push({
        toolCallId: part.toolCallId,
        input: part.input,
        errorText: part.errorText,
      });
    }
  }

  return failedToolCalls;
}
