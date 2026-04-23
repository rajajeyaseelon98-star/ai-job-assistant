import { formatApiFetchThrownError, formatApiError, parseErrorFieldsFromJson } from "@/lib/api-error";

type ErrorWithCode = Error & { code?: string };

export type AiUiError = {
  message: string;
  isCreditsExhausted: boolean;
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
      };
    } catch {
      const message = formatApiFetchThrownError(error);
      return {
        message,
        isCreditsExhausted: isAiCreditsExhaustedMessage(message),
      };
    }
  }

  return {
    message: "Something went wrong",
    isCreditsExhausted: false,
  };
}

