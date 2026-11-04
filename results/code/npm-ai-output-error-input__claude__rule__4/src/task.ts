import type { UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  input: unknown;
  errorText: string;
};

export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  const failed: FailedToolCall[] = [];

  for (const part of message.parts) {
    const isToolPart = part.type.startsWith('tool-') || part.type === 'dynamic-tool';
    if (!isToolPart || !('state' in part) || part.state !== 'output-error') continue;

    failed.push({
      toolCallId: part.toolCallId,
      input: part.input,
      errorText: part.errorText,
    });
  }

  return failed;
}
