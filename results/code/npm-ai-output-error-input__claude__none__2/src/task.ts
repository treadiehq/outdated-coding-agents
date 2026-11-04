import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export interface FailedToolCall {
  toolCallId: string;
  /** Arguments the model passed to the tool. */
  input: unknown;
  errorText: string;
}

/**
 * Returns every tool part (static or dynamic) in the message that ended in
 * the `output-error` state.
 */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  const failed: FailedToolCall[] = [];

  for (const part of message.parts) {
    if (!isToolOutputErrorUIPart(part)) continue;

    failed.push({
      toolCallId: part.toolCallId,
      // `input` is undefined when the model's arguments failed validation;
      // the raw arguments are then kept in `rawInput`.
      input: part.input ?? part.rawInput,
      errorText: part.errorText,
    });
  }

  return failed;
}
