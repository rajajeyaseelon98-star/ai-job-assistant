"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Send,
  Calendar,
  Gift,
  FileText,
  Star,
  Zap,
  TrendingUp,
  Users,
  Award,
  Loader2,
} from "lucide-react";

interface ActivityItem {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  is_public: boolean;
  created_at: string;
}

interface PlatformStats {
  total_users: number;
  total_applications: number;
  total_interviews: number;
  total_hires: number;
  total_resumes_improved: number;
  avg_match_score: number;
}

const ACTIVITY_ICONS: Record<string, typeof Activity> = {
  application_submitted: Send,
  interview_scheduled: Calendar,
  offer_received: Gift,
  resume_improved: FileText,
  skill_added: Star,
  profile_updated: Users,
  milestone: Award,
  auto_apply_completed: Zap,
  score_improved: TrendingUp,
};

const ACTIVITY_COLORS: Record<string, string> = {
  application_submitted: "text-blue-600 bg-blue-100",
  interview_scheduled: "text-purple-600 bg-purple-100",
  offer_received: "text-green-600 bg-green-100",
  resume_improved: "text-orange-600 bg-orange-100",
  skill_added: "text-yellow-600 bg-yellow-100",
  profile_updated: "text-gray-600 bg-gray-100",
  milestone: "text-pink-600 bg-pink-100",
  auto_apply_completed: "text-indigo-600 bg-indigo-100",
  score_improved: "text-emerald-600 bg-emerald-100",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ActivityFeedPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"my" | "public">("my");

  useEffect(() => {
    fetchData();
  }, [tab]);

  async function fetchData() {
    setLoading(true);
    try {
      const [feedRes, statsRes] = await Promise.all([
        fetch(`/api/activity-feed${tab === "public" ? "?public=true" : ""}`),
        fetch("/api/platform-stats"),
      ]);

      if (feedRes.ok) setActivities(await feedRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch {
      // Ignore
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">Activity Feed</h1>
        <p className="text-sm sm:text-base text-text-muted">
          Track your journey and see community milestones
        </p>
      </div>

      {/* Platform Stats (Social Proof) */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {[
            { label: "Users", value: stats.total_users.toLocaleString(), icon: Users },
            { label: "Applications", value: stats.total_applications.toLocaleString(), icon: Send },
            { label: "Interviews", value: stats.total_interviews.toLocaleString(), icon: Calendar },
            { label: "Hires", value: stats.total_hires.toLocaleString(), icon: Gift },
            { label: "Resumes Improved", value: stats.total_resumes_improved.toLocaleString(), icon: FileText },
            { label: "Avg Match", value: `${stats.avg_match_score}%`, icon: TrendingUp },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-card p-3 text-center"
            >
              <stat.icon className="mx-auto mb-1 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <div className="text-base sm:text-lg font-bold text-text">{stat.value}</div>
              <div className="text-xs text-text-muted truncate">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setTab("my")}
          className={`min-h-[44px] px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
            tab === "my"
              ? "border-b-2 border-primary text-primary"
              : "text-text-muted hover:text-text"
          }`}
        >
          My Activity
        </button>
        <button
          onClick={() => setTab("public")}
          className={`min-h-[44px] px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
            tab === "public"
              ? "border-b-2 border-primary text-primary"
              : "text-text-muted hover:text-text"
          }`}
        >
          Community
        </button>
      </div>

      {/* Activity List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-card p-8 text-center">
          <Activity className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <h3 className="font-medium text-text">No activity yet</h3>
          <p className="mt-1 text-sm text-text-muted">
            {tab === "my"
              ? "Start applying to jobs, improving your resume, or setting up smart auto-apply to see your activity here."
              : "Community milestones will appear here as users reach achievements."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((item) => {
            const Icon = ACTIVITY_ICONS[item.activity_type] || Activity;
            const color = ACTIVITY_COLORS[item.activity_type] || "text-gray-600 bg-gray-100";

            return (
              <div
                key={item.id}
                className="flex items-start gap-3 sm:gap-4 rounded-xl border border-gray-200 bg-card px-4 py-4 sm:px-5 sm:py-5"
              >
                <div className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full ${color}`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-medium text-text truncate">{item.title}</h3>
                  {item.description && (
                    <p className="mt-0.5 text-xs sm:text-sm text-text-muted line-clamp-2">{item.description}</p>
                  )}
                  <span className="mt-1 text-xs text-text-muted">
                    {timeAgo(item.created_at)}
                  </span>
                </div>
                {item.is_public && tab === "my" && (
                  <span className="shrink-0 rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    Public
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
