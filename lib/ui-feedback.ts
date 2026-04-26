import { formatApiFetchThrownError, parseErrorFieldsFromJson } from "@/lib/api-error";
import { toAiUiError } from "@/lib/client-ai-error";

export type UiFeedback = {
  message: string;
  retryable: boolean;
  requestId?: string;
  nextAction?: string;
  isCreditsExhausted: boolean;
};

export function toUiFeedback(error: unknown): UiFeedback {
  const ai = toAiUiError(error);
  const fallback: UiFeedback = {
    message: ai.message || "Something went wrong",
    retryable: ai.retryable ?? true,
    requestId: ai.requestId,
    nextAction: ai.nextAction,
    isCreditsExhausted: ai.isCreditsExhausted,
  };

  if (!(error instanceof Error) || !error.message) {
    return fallback;
  }

  try {
    const parsed = parseErrorFieldsFromJson(JSON.parse(error.message) as unknown);
    return {
      message: fallback.message,
      retryable: parsed.retryable ?? fallback.retryable,
      requestId: parsed.requestId ?? fallback.requestId,
      nextAction: parsed.nextAction ?? fallback.nextAction,
      isCreditsExhausted: fallback.isCreditsExhausted,
    };
  } catch {
    return {
      ...fallback,
      message: formatApiFetchThrownError(error),
    };
  }
}
