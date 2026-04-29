import { formatApiFetchThrownError, formatApiError, parseErrorFieldsFromJson } from "@/lib/api-error";

type ErrorWithCode = Error & { code?: string };

export type AiUiError = {
  message: string;
  isCreditsExhausted: boolean;
  retryable?: boolean;
  requestId?: string;
  nextAction?: string;
};

export function isAiCreditsExhaustedMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  return /CREDITS_EXHAUSTED|AI credit limit|credits exhausted/i.test(message);
}

export function toAiUiError(error: unknown): AiUiError {
  const byCode =
    error instanceof Error &&
    typeof (error as ErrorWithCode).code === "string" &&
    (error as ErrorWithCode).code === "CREDITS_EXHAUSTED";
  if (byCode) {
    return {
      message: "You have reached your AI credit limit. Please upgrade to continue.",
      isCreditsExhausted: true,
    };
  }

  if (error instanceof Error && error.message) {
    try {
      const parsed = JSON.parse(error.message) as unknown;
      const fields = parseErrorFieldsFromJson(parsed);
      const message = formatApiError(fields) || formatApiFetchThrownError(error);
      return {
        message,
        isCreditsExhausted: fields.error === "CREDITS_EXHAUSTED" || isAiCreditsExhaustedMessage(message),
        retryable: fields.retryable,
        requestId: fields.requestId,
        nextAction: fields.nextAction,
      };
    } catch {
      const message = formatApiFetchThrownError(error);
      return {
        message,
        isCreditsExhausted: isAiCreditsExhaustedMessage(message),
        retryable: undefined,
        requestId: undefined,
        nextAction: undefined,
      };
    }
  }

  return {
    message: "Something went wrong",
    isCreditsExhausted: false,
    retryable: undefined,
    requestId: undefined,
    nextAction: undefined,
  };
}

