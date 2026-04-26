import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AutoApplyJobResult } from "@/types/autoApply";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", requestId, retryable: false }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("auto_apply_runs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Run not found", requestId, retryable: false, nextAction: "Start a new auto-apply run" },
      { status: 404 }
    );
  }

  const results = ((data.results as AutoApplyJobResult[] | null) ?? []);
  const failedItems = results
    .filter((item) => typeof (item as { error_message?: unknown }).error_message === "string")
    .map((item) => ({
      jobId: item.job_id,
      title: item.title,
      reason: String((item as { error_message?: string }).error_message),
    }));

  const currentStep =
    data.status === "pending"
      ? "queued"
      : data.status === "processing"
        ? "matching"
        : data.status === "ready_for_review"
          ? "ready"
          : data.status === "completed"
            ? "applied"
            : data.status;

  return NextResponse.json({
    ...data,
    currentStep,
    processedCount: Number(data.jobs_matched ?? 0),
    failedCount: failedItems.length,
    failedItems,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", requestId, retryable: false }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", requestId, retryable: false }, { status: 400 });
  }

  const { selected_job_ids } = body as { selected_job_ids?: string[] };
  if (!Array.isArray(selected_job_ids)) {
    return NextResponse.json({ error: "selected_job_ids array required", requestId, retryable: false }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: run } = await supabase
    .from("auto_apply_runs")
    .select("results, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!run || run.status !== "ready_for_review") {
    return NextResponse.json(
      {
        error: "Run not found or not ready for review",
        requestId,
        retryable: false,
        nextAction: "Refresh run status before editing selections",
      },
      { status: 400 }
    );
  }

  const results = (run.results as Record<string, unknown>[]) || [];
  const selectedSet = new Set(selected_job_ids);
  const updated = results.map((r) => ({
    ...r,
    selected: selectedSet.has(String(r.job_id)),
  }));

  const { error: updateError } = await supabase
    .from("auto_apply_runs")
    .update({ results: updated, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (updateError) {
    return NextResponse.json(
      {
        error: "Failed to save selection updates",
        requestId,
        retryable: true,
        nextAction: "Retry save",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Selection updated",
    meta: { requestId, nextStep: "Confirm apply when ready" },
  });
}
