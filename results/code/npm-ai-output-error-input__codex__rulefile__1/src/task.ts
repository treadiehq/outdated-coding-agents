import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export interface FailedToolCall {
  toolCallId: string;
  input: unknown;
  errorText: string;
}

/** Returns failures from both static and dynamic tool parts, in message order. */
export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  return message.parts.filter(isToolOutputErrorUIPart).map(part => ({
    toolCallId: part.toolCallId,
    // SDK 7 stores arguments here, including input that failed validation.
    input: part.input,
    errorText: part.errorText,
  }));
}
