/** Map common API / network errors to human, recovery-focused copy. */

export function humanizeUnknownError(fallback = "Something went wrong. Please try again in a moment."): string {
  return fallback;
}

export function humanizeNetworkError(): string {
  return "We couldn’t reach the server. Check your connection and try again.";
}

/** Improve-resume / tailor endpoints */
export function humanizeImproveResumeError(raw: string | undefined): string {
  if (!raw) {
    return "We couldn’t improve your resume right now. Wait a moment and try again, or shorten your text.";
  }
  const t = raw.trim();
  if (/pro feature|upgrade/i.test(t)) return t;
  if (/too many requests|429/i.test(t)) return "Too many requests — wait a minute and try again.";
  if (/unauthorized|401/i.test(t)) return "Your session expired. Sign in again and retry.";
  return t;
}

/** Resume file upload (PDF/DOCX) */
export function humanizeUploadResumeError(raw: string | undefined): string {
  if (!raw) return humanizeUnknownError();
  const t = raw.trim();
  if (/couldn’t read|couldn't read|copy-paste/i.test(t)) return t;
  if (/Failed to extract|extract text|read text from this file/i.test(t)) {
    return "We couldn’t read this file. Try DOCX, another PDF, or paste your resume text.";
  }
  if (/too many requests|429/i.test(t)) {
    return "Too many requests — wait a minute and try again.";
  }
  if (/unauthorized|401/i.test(t)) return "Your session expired. Sign in again and retry.";
  return t;
}

/** Cover letter generator (job board + /cover-letter) */
export function humanizeCoverLetterError(raw: string | undefined): string {
  if (!raw) return humanizeUnknownError();
  const t = raw.trim();
  if (/free limit|upgrade to pro/i.test(t)) return t;
  if (/too many requests|429/i.test(t)) {
    return "Too many requests — wait a minute and try again.";
  }
  if (/unauthorized|401/i.test(t)) return "Your session expired. Sign in again and retry.";
  if (/no extracted text|re-upload|resume analyzer/i.test(t)) return t;
  return t;
}

/** Smart Auto-Apply / generic POST errors */
export function humanizeSmartApplyError(raw: string | undefined): string {
  if (!raw) return humanizeUnknownError();
  const t = raw.trim();
  if (/pro feature|upgrade/i.test(t)) return t;
  if (/resume not found/i.test(t)) return "We couldn’t find that resume. Upload one again from Resume Analyzer.";
  if (/invalid json/i.test(t)) return "That request couldn’t be sent. Refresh the page and try again.";
  return t;
}
