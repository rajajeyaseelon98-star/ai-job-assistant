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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.href + a.label}
            href={a.href}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <span className="font-medium text-text">{a.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
