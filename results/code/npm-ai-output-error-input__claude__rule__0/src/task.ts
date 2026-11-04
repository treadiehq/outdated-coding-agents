import { isToolUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  input: unknown;
  errorText: string;
};

export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  const failed: FailedToolCall[] = [];

  for (const part of message.parts) {
    if (isToolUIPart(part) && part.state === 'output-error') {
      failed.push({
        toolCallId: part.toolCallId,
        input: part.input,
        errorText: part.errorText,
      });
    }
  }

  return failed;
}
