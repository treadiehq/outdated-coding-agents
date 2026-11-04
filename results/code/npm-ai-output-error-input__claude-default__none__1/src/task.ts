import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  input: unknown;
  errorText: string;
};

export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  return message.parts.filter(isToolOutputErrorUIPart).map(part => ({
    toolCallId: part.toolCallId,
    // Messages persisted by older SDK versions may only have the deprecated
    // `rawInput` field, so fall back to it the way `convertToModelMessages` does.
    input: part.input ?? ('rawInput' in part ? part.rawInput : undefined),
    errorText: part.errorText,
  }));
}
