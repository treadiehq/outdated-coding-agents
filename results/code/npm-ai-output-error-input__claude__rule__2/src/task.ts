import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  input: unknown;
  errorText: string;
};

export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  const failed: FailedToolCall[] = [];

  for (const part of message.parts) {
    if (isToolOutputErrorUIPart(part)) {
      failed.push({
        toolCallId: part.toolCallId,
        input: part.input,
        errorText: part.errorText,
      });
    }
  }

  return failed;
}
