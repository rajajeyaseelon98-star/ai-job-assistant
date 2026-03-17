export default function AutoApplyLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-72 animate-pulse rounded bg-gray-200" />
      <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
