import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  /** May be undefined if the call failed before any input was recorded. */
  input: unknown;
  errorText: string;
};

export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  return message.parts.filter(isToolOutputErrorUIPart).map(part => ({
    toolCallId: part.toolCallId,
    // Messages persisted by older SDK versions can hold the input in the
    // deprecated `rawInput` field, so fall back the way convertToModelMessages does.
    input: part.input ?? ('rawInput' in part ? part.rawInput : undefined),
    errorText: part.errorText,
  }));
}
