import Link from "next/link";
import { FileText, Target, Mail, Mic2, Upload } from "lucide-react";

const actions = [
  { href: "/resume-analyzer", label: "Analyze Resume", icon: FileText },
  { href: "/job-match", label: "Match Job", icon: Target },
  { href: "/cover-letter", label: "Cover Letter", icon: Mail },
  { href: "/interview-prep", label: "Interview Prep", icon: Mic2 },
  { href: "/resume-analyzer", label: "Upload Resume", icon: Upload },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.href + a.label}
            href={a.href}
            className="flex items-center gap-2 sm:gap-3 md:gap-4 rounded-xl border border-gray-200 bg-card px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 shadow-sm transition-shadow hover:shadow-md active:shadow-inner active:bg-gray-50 min-h-[44px]"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className="font-medium text-sm sm:text-base text-text truncate">{a.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
