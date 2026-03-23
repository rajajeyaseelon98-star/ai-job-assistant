import Link from "next/link";
import {
  PenLine,
  Search,
  Zap,
  Wand2,
  Mail,
  Mic2,
  Briefcase,
  Brain,
  ClipboardList,
} from "lucide-react";

const actions = [
  { href: "/resume-builder", label: "Quick Resume Builder", icon: PenLine },
  { href: "/job-board", label: "Job Board", icon: Briefcase },
  { href: "/job-finder", label: "Auto Job Finder", icon: Search },
  { href: "/smart-apply", label: "Smart Auto-Apply", icon: Zap },
  { href: "/tailor-resume", label: "Resume Tailoring", icon: Wand2 },
  { href: "/cover-letter", label: "Cover Letter", icon: Mail },
  { href: "/interview-prep", label: "Interview Prep", icon: Mic2 },
  { href: "/career-coach", label: "AI Career Coach", icon: Brain },
  { href: "/applications", label: "Applications tracker", icon: ClipboardList },
];

export function ExploreMoreActions() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.href}
            href={a.href}
            className="group flex min-h-[44px] min-w-[44px] cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:-translate-y-px hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="font-display truncate text-sm font-medium text-slate-900 sm:text-base">{a.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
