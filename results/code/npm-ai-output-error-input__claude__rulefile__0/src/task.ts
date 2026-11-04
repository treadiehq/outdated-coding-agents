import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  /** Arguments the model passed to the tool. */
  input: unknown;
  errorText: string;
};

export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  const failed: FailedToolCall[] = [];

  for (const part of message.parts) {
    if (!isToolOutputErrorUIPart(part)) continue;

    // When the model's arguments failed validation, `input` is undefined and
    // the raw arguments are only available in the deprecated `rawInput`.
    const input =
      part.input === undefined && 'rawInput' in part ? part.rawInput : part.input;

    failed.push({
      toolCallId: part.toolCallId,
      input,
      errorText: part.errorText,
    });
  }

  return failed;
}
