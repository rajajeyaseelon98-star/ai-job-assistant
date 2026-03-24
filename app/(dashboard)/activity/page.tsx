"use client";

import { useState } from "react";
import { useActivityFeed, usePlatformStats } from "@/hooks/queries/use-activity";
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
  const [tab, setTab] = useState<"my" | "public">("my");

  const { data: feedData, isLoading: feedLoading } = useActivityFeed(tab === "public");
  const { data: statsData } = usePlatformStats();

  const activities: ActivityItem[] = Array.isArray(feedData) ? feedData : (feedData as any)?.items ?? [];
  const stats = statsData ?? null;
  const loading = feedLoading;

  return (
    <div className="max-w-5xl mx-auto w-full py-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Activity Feed</h1>
        <p className="text-slate-500 text-base mt-2">
          Track your journey and see community milestones
        </p>
      </div>

      {/* Platform Stats (Social Proof) */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
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
              className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 text-center transition-all hover:shadow-md hover:border-indigo-100 group"
            >
              <div className="mb-2 flex justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="block font-display text-2xl font-bold text-slate-900">{stat.value}</span>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 truncate">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-8 flex gap-8">
        <button
          onClick={() => setTab("my")}
          className={`text-sm whitespace-nowrap ${
            tab === "my"
              ? "text-indigo-600 border-b-2 border-indigo-600 pb-4 text-sm font-semibold"
              : "text-slate-500 hover:text-slate-700 pb-4 text-sm font-medium transition-colors"
          }`}
        >
          My Activity
        </button>
        <button
          onClick={() => setTab("public")}
          className={`text-sm whitespace-nowrap ${
            tab === "public"
              ? "text-indigo-600 border-b-2 border-indigo-600 pb-4 text-sm font-semibold"
              : "text-slate-500 hover:text-slate-700 pb-4 text-sm font-medium transition-colors"
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
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
          <div className="py-20 px-6 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Activity className="h-7 w-7" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900 mb-2">No activity yet</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
            {tab === "my"
              ? "Start applying to jobs, improving your resume, or setting up smart auto-apply to see your activity here."
              : "Community milestones will appear here as users reach achievements."}
            </p>
            {tab === "my" && (
              <p className="text-sm text-slate-500">
                Start with{" "}
                <a href="/auto-apply" className="text-indigo-600 font-semibold hover:underline">
                  AI Auto-Apply
                </a>{" "}
                or{" "}
                <a href="/resume-analyzer" className="text-indigo-600 font-semibold hover:underline">
                  Resume Analyzer
                </a>
                .
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
          {activities.map((item) => {
            const Icon = ACTIVITY_ICONS[item.activity_type] || Activity;
            const color = ACTIVITY_COLORS[item.activity_type] || "text-slate-500 bg-slate-100";

            return (
              <div
                key={item.id}
                className="flex gap-4 p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                  <span className="text-xs text-slate-400 mt-1 block">
                    {timeAgo(item.created_at)}
                  </span>
                  {item.description && (
                    <p className="mt-2 text-xs text-slate-500 bg-white border border-slate-100 p-2 rounded-lg">{item.description}</p>
                  )}
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
