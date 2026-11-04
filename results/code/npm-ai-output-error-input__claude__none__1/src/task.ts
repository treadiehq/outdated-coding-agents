import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export interface FailedToolCall {
  toolCallId: string;
  /** Arguments the model passed to the tool. */
  input: unknown;
  errorText: string;
}

export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  return message.parts.filter(isToolOutputErrorUIPart).map(part => ({
    toolCallId: part.toolCallId,
    // If the model's arguments failed schema validation, `input` is undefined
    // and the raw arguments are in the deprecated `rawInput`.
    input: part.input ?? (part as { rawInput?: unknown }).rawInput,
    errorText: part.errorText,
  }));
}
