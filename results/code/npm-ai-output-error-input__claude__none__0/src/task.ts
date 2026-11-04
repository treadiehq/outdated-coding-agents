import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export interface FailedToolCall {
  toolCallId: string;
  /** Arguments the model passed to the tool (raw input if it failed validation). */
  input: unknown;
  errorText: string;
}

export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  return message.parts.filter(isToolOutputErrorUIPart).map(part => ({
    toolCallId: part.toolCallId,
    // `input` is undefined when the model's arguments failed schema validation;
    // the unparsed arguments are then kept in `rawInput`.
    input: part.input ?? ('rawInput' in part ? part.rawInput : undefined),
    errorText: part.errorText,
  }));
}
