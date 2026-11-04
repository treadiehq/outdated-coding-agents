import { isToolOutputErrorUIPart, type UIMessage } from 'ai';

export type FailedToolCall = {
  toolCallId: string;
  /** May be `undefined` if the part recorded no input for the call. */
  input: unknown;
  errorText: string;
};

export function getFailedToolCalls(message: UIMessage): FailedToolCall[] {
  const failures: FailedToolCall[] = [];

  for (const part of message.parts) {
    if (!isToolOutputErrorUIPart(part)) continue;

    failures.push({
      toolCallId: part.toolCallId,
      // Messages persisted by older SDK versions can hold the arguments only in
      // the deprecated `rawInput` field, so fall back the way
      // `convertToModelMessages` does.
      input: part.input ?? ('rawInput' in part ? part.rawInput : undefined),
      errorText: part.errorText,
    });
  }

  return failures;
}
