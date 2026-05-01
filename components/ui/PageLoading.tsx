type PageLoadingVariant = "default" | "dashboard" | "dense";

/**
 * Consistent dashboard page skeleton — use in route `loading.tsx` files.
 */
export function PageLoading({
  titleWidth = "w-48",
  variant = "default",
}: {
  titleWidth?: string;
  variant?: PageLoadingVariant;
}) {
  if (variant === "dashboard") {
    return (
      <div className="space-y-6 animate-pulse" aria-hidden>
        <div className={`h-8 ${titleWidth} rounded-md bg-surface-muted`} />
        <div className="h-24 rounded-xl border border-border bg-surface-muted" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-border bg-surface-muted" />
          ))}
        </div>
        <div className="h-40 rounded-xl border border-border bg-surface-muted" />
        <div className="h-6 w-40 rounded-md bg-surface-muted" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-border bg-surface-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "dense") {
    return (
      <div className="space-y-6 animate-pulse" aria-hidden>
        <div className={`h-8 ${titleWidth} rounded-md bg-surface-muted`} />
        <div className="h-4 w-full max-w-xl rounded bg-surface-muted" />
        <div className="h-56 rounded-xl border border-border bg-surface-muted" />
        <div className="h-72 rounded-xl border border-border bg-surface-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-pulse" aria-hidden>
      <div className={`h-8 ${titleWidth} rounded-md bg-surface-muted`} />
      <div className="h-4 w-full max-w-xl rounded bg-surface-muted" />
      <div className="h-40 rounded-xl border border-border bg-surface-muted" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-32 rounded-xl border border-border bg-surface-muted" />
        <div className="h-32 rounded-xl border border-border bg-surface-muted" />
      </div>
    </div>
  );
}
