import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export interface FailedToolCall {
  toolCallId: string;
  /** Arguments the model passed to the tool. */
  input: unknown;
  errorText: string;
}

/**
 * Returns the tool call ID, model-supplied arguments, and error text for every
 * tool part in the message that ended in the `output-error` state.
 *
 * If the model's arguments failed schema validation, `input` is undefined on
 * the part and the raw arguments are in `rawInput`, so we fall back to that.
 */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  const failed: FailedToolCall[] = [];

  for (const part of message.parts) {
    if (!isToolOutputErrorUIPart(part)) continue;

    failed.push({
      toolCallId: part.toolCallId,
      input: part.input ?? part.rawInput,
      errorText: part.errorText,
    });
  }

  return failed;
}
