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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.href}
            href={a.href}
            className="group flex min-h-[44px] min-w-[44px] cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-px hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 text-left">
                <span className="font-display block text-sm font-semibold text-slate-900 sm:text-base">{a.label}</span>
                <span className="font-sans text-xs text-slate-500">{a.description}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
