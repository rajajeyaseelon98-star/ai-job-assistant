"use client";

import { useEffect, useRef } from "react";
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
import {
  useOpportunityAlerts,
  useTriggerAlertScan,
  useDismissAlert,
} from "@/hooks/queries/use-opportunity-alerts";

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
  const { data: alerts = [], isLoading } = useOpportunityAlerts();
  const triggerScan = useTriggerAlertScan();
  const dismissMutation = useDismissAlert();

  const scanned = useRef(false);
  useEffect(() => {
    if (scanned.current) return;
    scanned.current = true;
    triggerScan.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading || alerts.length === 0) return null;

  return (
    <div className="space-y-2 sm:space-y-3">
      <h3 className="font-display flex items-center gap-2 text-lg font-semibold text-slate-900 sm:text-xl md:text-2xl">
        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 shrink-0" />
        <span className="truncate">Opportunities</span>
        <span className="rounded-full bg-orange-100 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium text-orange-600 shrink-0">
          {alerts.length}
        </span>
      </h3>

      {alerts.slice(0, 3).map((alert) => {
        const Icon = ALERT_ICONS[alert.alert_type] || Target;
        const style = URGENCY_STYLES[alert.urgency] || URGENCY_STYLES.normal;

        return (
          <div
            key={alert.id}
            className={`flex items-start gap-2 sm:gap-3 md:gap-4 rounded-xl border ${style.border} ${style.bg} px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6`}
          >
            <Icon className={`mt-0.5 h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${style.icon}`} />
            <div className="min-w-0 flex-1">
              <p className={`text-sm sm:text-base font-medium ${style.text} truncate`}>{alert.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 sm:mt-1 sm:text-sm">{alert.message}</p>
              {alert.action_url && (
                <Link
                  href={alert.action_url}
                  className="mt-1.5 sm:mt-2 inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-primary hover:underline active:opacity-70 active:bg-white/30 rounded-md min-h-[44px] transition-colors"
                >
                  Take action <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Link>
              )}
            </div>
            <button
              onClick={() => dismissMutation.mutate(alert.id)}
              className="shrink-0 rounded-md hover:bg-white/50 active:bg-white/70 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4 text-slate-400 sm:h-5 sm:w-5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
