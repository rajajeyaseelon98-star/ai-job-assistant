import Link from "next/link";
import { FileText, Target, Rocket } from "lucide-react";

const actions = [
  {
    href: "/resume-analyzer",
    label: "Resume Analyzer",
    description: "ATS score & gaps",
    icon: FileText,
  },
  {
    href: "/job-match",
    label: "Job Match",
    description: "Fit & keywords",
    icon: Target,
  },
  {
    href: "/auto-apply",
    label: "AI Auto-Apply",
    description: "We apply for you",
    icon: Rocket,
  },
];

export function StartHereActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col gap-1 rounded-xl border-2 border-primary/15 bg-card px-4 py-4 sm:px-5 sm:py-5 shadow-sm transition-shadow hover:shadow-md hover:border-primary/30 active:bg-gray-50 min-h-[44px]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 text-left">
                <span className="font-semibold text-sm sm:text-base text-text block">{a.label}</span>
                <span className="text-xs text-text-muted">{a.description}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
