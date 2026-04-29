import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

type EmailLogRow = {
  id: string;
  attempt_count: number;
  event_type: string;
  category: "marketplace" | "invites" | "all";
  idempotency_key: string | null;
  meta: Record<string, unknown> | null;
};

function isAuthorized(request: Request) {
  const internal = process.env.INTERNAL_CRON_SECRET;
  const cron = process.env.CRON_SECRET;

  if (internal) {
    const header = request.headers.get("x-internal-cron-secret");
    if (header && header === internal) return true;
  }

  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : auth;
  if (internal && token === internal) return true;
  if (cron && token === cron) return true;
  return false;
}

async function runRetryJob(limit: number) {
  const admin = createServiceRoleClient();
  if (!admin) {
    return { error: "Service role client unavailable", status: 500 as const };
  }

  const startedAt = new Date().toISOString();
  let runId: string | null = null;
  try {
    const { data: run } = await admin
      .from("email_job_runs")
      .insert({
        job_name: "email_retry",
        ok: true,
        started_at: startedAt,
        summary: { limit },
      })
      .select("id")
      .limit(1);
    runId = (run || [])[0]?.id || null;
  } catch {
    // Non-blocking: job run logging must never break retries.
    runId = null;
  }

  const { data: rows, error } = await admin
    .from("email_logs")
    .select("id,attempt_count,event_type,category,idempotency_key,meta,next_retry_at")
    .eq("status", "failed")
    .eq("retryable", true)
    .lt("attempt_count", 3)
    .order("next_retry_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    try {
      if (runId) {
        await admin
          .from("email_job_runs")
          .update({
            ok: false,
            finished_at: new Date().toISOString(),
            summary: { limit, error: error.message },
          })
          .eq("id", runId);
      }
    } catch {
      // ignore
    }
    return { error: "Failed to load retry queue", detail: error.message, status: 500 as const };
  }

  let retried = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of (rows || []) as EmailLogRow[]) {
    const payload = (row.meta?.payload || {}) as Record<string, unknown>;
    const to = typeof payload.to === "string" ? payload.to : "";
    const subject = typeof payload.subject === "string" ? payload.subject : "";
    const html = typeof payload.html === "string" ? payload.html : "";
    const text = typeof payload.text === "string" ? payload.text : undefined;
    const category =
      payload.category === "marketplace" || payload.category === "invites" || payload.category === "all"
        ? payload.category
        : row.category;
    const eventType = typeof payload.eventType === "string" ? payload.eventType : row.event_type;
    const idempotencyKey =
      typeof payload.idempotencyKey === "string" && payload.idempotencyKey
        ? payload.idempotencyKey
        : row.idempotency_key || undefined;

    if (!to || !subject || !html) {
      skipped++;
      continue;
    }

    retried++;
    const result = await sendEmail({
      to,
      subject,
      html,
      text,
      category,
      eventType,
      idempotencyKey,
      attemptCount: Math.max(1, (row.attempt_count || 1) + 1),
      meta: {
        ...(row.meta || {}),
        retry_source_email_log_id: row.id,
        retry_job_run_id: runId,
      },
    });

    if (result.status === "sent") succeeded++;
    else if (result.status === "skipped") skipped++;
    else failed++;
  }

  try {
    if (runId) {
      await admin
        .from("email_job_runs")
        .update({
          ok: true,
          finished_at: new Date().toISOString(),
          summary: {
            limit,
            processed: (rows || []).length,
            retried,
            succeeded,
            failed,
            skipped,
          },
        })
        .eq("id", runId);
    }
  } catch {
    // ignore
  }

  return { ok: true, retried, succeeded, failed, skipped, runId };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.max(1, Math.min(100, Number(new URL(request.url).searchParams.get("limit") || 30) || 30));
  const result = await runRetryJob(limit);
  if ("status" in result) {
    return NextResponse.json({ error: result.error, detail: (result as { detail?: string }).detail }, { status: result.status });
  }
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const limit = Math.max(1, Math.min(100, Number(body.limit || 30) || 30));

  const result = await runRetryJob(limit);
  if ("status" in result) {
    return NextResponse.json({ error: result.error, detail: (result as { detail?: string }).detail }, { status: result.status });
  }
  return NextResponse.json(result);
}

