import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export interface FailedToolCall {
  toolCallId: string;
  /** The arguments the model passed; may not match the tool's schema, or may be undefined. */
  input: unknown;
  errorText: string;
}

export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  const failedToolCalls: FailedToolCall[] = [];

  for (const part of message.parts) {
    if (!isToolOutputErrorUIPart(part)) continue;

    failedToolCalls.push({
      toolCallId: part.toolCallId,
      // Messages persisted by older SDK versions may only have the deprecated `rawInput`.
      input: part.input ?? ('rawInput' in part ? part.rawInput : undefined),
      errorText: part.errorText,
    });
  }

  return failedToolCalls;
}
