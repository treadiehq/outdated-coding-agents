import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export interface FailedToolCall {
  toolCallId: string;
  /** Arguments the model passed to the tool. */
  input: unknown;
  errorText: string;
}

export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  const failed: FailedToolCall[] = [];

  for (const part of message.parts) {
    if (!isToolOutputErrorUIPart(part)) continue;

    failed.push({
      toolCallId: part.toolCallId,
      // When the model's arguments fail schema validation, `input` is undefined
      // and the raw arguments are kept in the (deprecated) `rawInput`.
      input: part.input ?? ('rawInput' in part ? part.rawInput : undefined),
      errorText: part.errorText,
    });
  }

  return failed;
}
