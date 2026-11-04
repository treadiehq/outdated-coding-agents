import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export interface FailedToolCall {
  toolCallId: string;
  input: unknown;
  errorText: string;
}

/** Returns failed static and dynamic tool calls in message order. */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  return message.parts.filter(isToolOutputErrorUIPart).map(part => ({
    toolCallId: part.toolCallId,
    // Current SDK versions store arguments in input; rawInput is deprecated.
    input: part.input,
    errorText: part.errorText,
  }));
}
