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
      <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
        <h3 className="font-medium text-text">Recent Activity</h3>
        <p className="mt-2 text-sm text-text-muted">No activity yet. Analyze a resume or match a job to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
      <h3 className="font-medium text-text">Recent Activity</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between border-b border-gray-100 pb-3 last:border-0">
            <div>
              <p className="text-sm font-medium text-text">{item.title}</p>
              {item.subtitle && (
                <p className="text-xs text-text-muted">{item.subtitle}</p>
              )}
            </div>
            <span className="text-xs text-text-muted">{item.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
