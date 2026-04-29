export const CREDITS_EXHAUSTED_CODE = "CREDITS_EXHAUSTED";

export function isCreditsExhaustedError(error: unknown): boolean {
  return error instanceof Error && error.message === CREDITS_EXHAUSTED_CODE;
}

