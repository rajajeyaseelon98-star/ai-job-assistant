/**
 * Lightweight skeletons for Suspense fallbacks inside pages.
 * Use these to wrap independent data-fetching sections so they stream in progressively.
 */

export function CardRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100/60" />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-16 rounded-xl border border-slate-200 bg-slate-100/60" />
      ))}
    </div>
  );
}

export function SectionSkeleton({ height = "h-40" }: { height?: string }) {
  return (
    <div className={`${height} animate-pulse rounded-xl border border-slate-200 bg-slate-100/60`} />
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-24 rounded-2xl border border-slate-200 bg-slate-100/60" />
      ))}
    </div>
  );
}
