"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Target,
  TrendingUp,
  Users,
  IndianRupee,
  Clock,
  X,
  Zap,
  ChevronRight,
} from "lucide-react";

interface OpportunityAlert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  urgency: string;
  action_url: string | null;
  seen: boolean;
  dismissed: boolean;
  created_at: string;
}

const ALERT_ICONS: Record<string, React.ElementType> = {
  high_match_job: Target,
  trending_role: TrendingUp,
  recruiter_interest: Users,
  salary_spike: IndianRupee,
  low_competition: Zap,
  deadline_approaching: Clock,
  new_skill_demand: TrendingUp,
};

const URGENCY_STYLES: Record<string, { border: string; bg: string; text: string; icon: string }> = {
  urgent: { border: "border-red-300", bg: "bg-red-50", text: "text-red-800", icon: "text-red-500" },
  high: { border: "border-orange-300", bg: "bg-orange-50", text: "text-orange-800", icon: "text-orange-500" },
  normal: { border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-800", icon: "text-blue-500" },
  low: { border: "border-gray-200", bg: "bg-gray-50", text: "text-gray-700", icon: "text-gray-500" },
};

export function OpportunityAlerts() {
  const [alerts, setAlerts] = useState<OpportunityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/opportunity-alerts?scan=true")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function dismiss(alertId: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    await fetch("/api/opportunity-alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alert_id: alertId, action: "dismiss" }),
    }).catch(() => {});
  }

  if (loading || alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
        <AlertTriangle className="h-4 w-4 text-orange-500" />
        Opportunities
        <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-600">
          {alerts.length}
        </span>
      </h3>

      {alerts.slice(0, 3).map((alert) => {
        const Icon = ALERT_ICONS[alert.alert_type] || Target;
        const style = URGENCY_STYLES[alert.urgency] || URGENCY_STYLES.normal;

        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-lg border ${style.border} ${style.bg} p-3`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.icon}`} />
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${style.text}`}>{alert.title}</p>
              <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{alert.message}</p>
              {alert.action_url && (
                <Link
                  href={alert.action_url}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Take action <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <button
              onClick={() => dismiss(alert.id)}
              className="shrink-0 rounded p-0.5 hover:bg-white/50"
              aria-label="Dismiss alert"
            >
              <X className="h-3.5 w-3.5 text-text-muted" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
