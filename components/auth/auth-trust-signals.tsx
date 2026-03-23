import { Shield, TrendingUp, Users } from "lucide-react";

/** Compact trust row for auth right panels — matches landing messaging. */
export function AuthTrustSignals() {
  return (
    <div className="mt-10 flex flex-wrap items-start justify-between gap-4 border-t border-slate-100 pt-8 sm:gap-6">
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
        <TrendingUp className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2} />
        <span className="text-2xs font-medium leading-snug text-slate-400 sm:text-[11px]">
          3.2× more interviews
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
        <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2} />
        <span className="text-2xs font-medium leading-snug text-slate-400 sm:text-[11px]">
          10,000+ users
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
        <Shield className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2} />
        <span className="text-2xs font-medium leading-snug text-slate-400 sm:text-[11px]">
          Secure &amp; private
        </span>
      </div>
    </div>
  );
}
