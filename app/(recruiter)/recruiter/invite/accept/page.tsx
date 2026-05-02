"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

type AcceptResult =
  | { ok: true; company_id?: string; role?: string }
  | { ok: false; status: number; error: string };

export default function RecruiterInviteAcceptPage() {
  const sp = useSearchParams();
  const token = useMemo(() => sp.get("token") || "", [sp]);

  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<AcceptResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!token) {
        setResult({ ok: false, status: 400, error: "Missing invite token." });
        setState("done");
        return;
      }
      setState("loading");
      try {
        const res = await fetch("/api/recruiter/company/invites/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          const msg = body?.error || `Failed to accept invite (HTTP ${res.status}).`;
          if (!cancelled) setResult({ ok: false, status: res.status, error: msg });
        } else {
          const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
          if (!cancelled) {
            setResult({
              ok: true,
              company_id: typeof body?.company_id === "string" ? body.company_id : undefined,
              role: typeof body?.role === "string" ? body.role : undefined,
            });
          }
        }
      } catch (e) {
        if (!cancelled) {
          setResult({ ok: false, status: 0, error: e instanceof Error ? e.message : "Unknown error" });
        }
      } finally {
        if (!cancelled) setState("done");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="mx-auto w-full max-w-xl py-12 px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">Accept company invite</h1>
      <p className="mt-2 text-sm text-slate-600">
        If you were invited to join a recruiter team, this will connect your account to the company.
      </p>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {state !== "done" ? (
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            <span className="text-sm">Accepting invite…</span>
          </div>
        ) : result?.ok ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Invite accepted</p>
                <p className="text-xs text-slate-600">
                  You can now access the recruiter dashboard.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/recruiter"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Go to Recruiter Dashboard
              </Link>
              <Link
                href="/recruiter/company"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                View company profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Could not accept invite</p>
                <p className="text-xs text-slate-600">{result?.error || "Unknown error"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/recruiter"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Open Recruiter Dashboard
              </Link>
              <Link
                href="/recruiter/settings"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Settings
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

