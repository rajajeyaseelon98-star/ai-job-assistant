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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-2 sm:gap-3 rounded-xl border border-gray-200 bg-card px-4 py-3 sm:px-5 sm:py-4 shadow-sm transition-shadow hover:shadow-md active:bg-gray-50 min-h-[44px]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-text-muted">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className="font-medium text-sm sm:text-base text-text truncate">{a.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
