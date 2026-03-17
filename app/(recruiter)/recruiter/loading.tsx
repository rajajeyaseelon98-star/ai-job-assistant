export default function RecruiterDashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
    </div>
  );
}
