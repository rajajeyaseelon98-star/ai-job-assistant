"use client";

type InlineRetryCardProps = {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
  alternateHref?: string;
  alternateLabel?: string;
  nextAction?: string;
};

export function InlineRetryCard({
  message,
  onRetry,
  retryLabel = "Retry",
  alternateHref,
  alternateLabel,
  nextAction,
}: InlineRetryCardProps) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
      <p className="text-sm text-rose-800">{message}</p>
      {nextAction ? <p className="mt-1 text-xs text-rose-700">Next: {nextAction}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
        >
          {retryLabel}
        </button>
        {alternateHref && alternateLabel ? (
          <a
            href={alternateHref}
            className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            {alternateLabel}
          </a>
        ) : null}
      </div>
    </div>
  );
}
