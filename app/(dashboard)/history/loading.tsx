export default function HistoryLoading() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
      ))}
    </div>
  );
}
