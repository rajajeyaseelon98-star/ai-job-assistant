interface ActivityItem {
  id: string;
  type: "resume_analysis" | "job_match" | "cover_letter";
  title: string;
  subtitle?: string;
  date: string;
}

interface ActivityListProps {
  items: ActivityItem[];
}

export function ActivityList({ items }: ActivityListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-card px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 shadow-sm">
        <h3 className="text-lg sm:text-xl md:text-2xl font-medium text-text">Recent Activity</h3>
        <p className="mt-2 sm:mt-3 text-sm sm:text-base text-text-muted">No activity yet. Analyze a resume or match a job to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-card px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 shadow-sm">
      <h3 className="text-lg sm:text-xl md:text-2xl font-medium text-text">Recent Activity</h3>
      <ul className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 md:space-y-4">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 md:gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-medium text-text truncate">{item.title}</p>
              {item.subtitle && (
                <p className="text-xs sm:text-sm text-text-muted truncate">{item.subtitle}</p>
              )}
            </div>
            <span className="text-xs sm:text-sm text-text-muted shrink-0">{item.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
