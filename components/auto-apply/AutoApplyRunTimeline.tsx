"use client";

type AutoApplyRunTimelineProps = {
  currentStep?: string;
};

const steps = ["queued", "finding jobs", "matching", "ready"];

export function AutoApplyRunTimeline({ currentStep }: AutoApplyRunTimelineProps) {
  const normalized =
    currentStep === "queued"
      ? "queued"
      : currentStep === "finding_jobs"
        ? "finding jobs"
        : currentStep === "matching"
          ? "matching"
          : "ready";
  const activeIndex = steps.findIndex((s) => s === normalized);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-800">Run timeline</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((step, index) => {
          const isDone = index <= activeIndex;
          return (
            <div
              key={step}
              className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                isDone
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              {step}
            </div>
          );
        })}
      </div>
    </div>
  );
}
