export default function ApplicationsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
      <div className="flex gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 w-32 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
    </div>
  );
}
