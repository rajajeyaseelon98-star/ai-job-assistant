"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { useRecruiterCompany, useSaveCompany } from "@/hooks/queries/use-recruiter";
import { InlineRetryCard } from "@/components/ui/InlineRetryCard";
import { ActionReceiptCard } from "@/components/ui/ActionReceiptCard";
import { toUiFeedback } from "@/lib/ui-feedback";

const inputClass =
  "mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 sm:text-sm";

export default function RecruiterOnboardingPage() {
  const router = useRouter();
  const companyQuery = useRecruiterCompany();
  const saveCompany = useSaveCompany();

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [location, setLocation] = useState("");
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  const existing = companyQuery.data as Record<string, unknown> | null | undefined;

  useEffect(() => {
    if (companyQuery.isLoading) return;
    if (existing?.id) {
      router.replace("/recruiter");
    }
  }, [companyQuery.isLoading, existing?.id, router]);

  if (companyQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            <span className="text-sm text-slate-600">Loading…</span>
          </div>
        </div>
      </div>
    );
  }

  const feedback = error ? toUiFeedback(error) : null;

  return (
    <div className="mx-auto w-full max-w-2xl py-10">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Set up your company
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Add your company details once. Then you can post jobs and review applications.
            </p>
          </div>
        </div>
      </header>

      {successId ? (
        <ActionReceiptCard
          title="Company created"
          description="You can now access the recruiter dashboard. Next: post your first job."
          primaryHref="/recruiter"
          primaryLabel="Go to Recruiter Dashboard"
          secondaryHref="/recruiter/company"
          secondaryLabel="Edit company profile"
        />
      ) : (
        <form
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              const result = await saveCompany.mutateAsync({
                name,
                website,
                industry,
                size,
                location,
              });
              const id = String((result as Record<string, unknown>).id || "");
              setSuccessId(id || "created");
              router.refresh();
            } catch (e2) {
              setError(e2);
            }
          }}
        >
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Company name *</label>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={saveCompany.isPending}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Website</label>
                <input
                  className={inputClass}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                  disabled={saveCompany.isPending}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Industry</label>
                <input
                  className={inputClass}
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Technology, Finance…"
                  disabled={saveCompany.isPending}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Company size</label>
                <select
                  className={inputClass}
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  disabled={saveCompany.isPending}
                >
                  <option value="">Select</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="501-1000">501-1000</option>
                  <option value="1000+">1000+</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Location</label>
                <input
                  className={inputClass}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Chennai, India"
                  disabled={saveCompany.isPending}
                />
              </div>
            </div>

            {feedback ? (
              <InlineRetryCard
                message={feedback.message}
                retryLabel="Try again"
                onRetry={() => setError(null)}
              />
            ) : null}

            <button
              type="submit"
              disabled={saveCompany.isPending}
              className="mt-2 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saveCompany.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create company"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

