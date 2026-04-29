import { Resend } from "resend";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  /** Optional feature gate category (e.g. "marketplace"). */
  category?: "marketplace" | "invites" | "all";
  /** Domain event identifier for observability/retries. */
  eventType?: string;
  /** Deduplication key to avoid duplicate delivered emails. */
  idempotencyKey?: string;
  /** Attempt number (1 for first send). */
  attemptCount?: number;
  /** Additional context for logs/replay. */
  meta?: Record<string, unknown>;
};

export type EmailSendResult = {
  ok: boolean;
  skipped?: boolean;
  status: "sent" | "skipped" | "failed";
  retryable: boolean;
  reason:
    | "sent"
    | "skipped_disabled"
    | "skipped_category_flag"
    | "skipped_missing_config"
    | "skipped_duplicate"
    | "failed_provider";
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
};

function nextRetryAt(attemptCount: number): string | null {
  if (attemptCount >= 3) return null;
  const backoffMinutes = attemptCount === 1 ? 5 : 30;
  return new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();
}

async function insertEmailLog(entry: {
  event_type: string;
  category: "marketplace" | "invites" | "all";
  recipient: string;
  subject: string;
  status: "queued" | "sent" | "skipped" | "failed";
  provider?: string;
  provider_message_id?: string | null;
  error?: string | null;
  error_code?: string | null;
  retryable?: boolean;
  attempt_count?: number;
  next_retry_at?: string | null;
  idempotency_key?: string | null;
  meta?: Record<string, unknown>;
}) {
  const admin = createServiceRoleClient();
  if (!admin) return;
  try {
    await admin.from("email_logs").insert({
      provider: "resend",
      retryable: false,
      attempt_count: 1,
      meta: {},
      ...entry,
    });
  } catch (e) {
    // Logging must never break core actions.
    console.warn("[email] email_log_insert_failed", {
      error: e instanceof Error ? e.message : String(e),
      event_type: entry.event_type,
      category: entry.category,
      recipient: entry.recipient,
      status: entry.status,
    });
  }
}

export async function sendEmail(input: SendEmailInput): Promise<EmailSendResult> {
  const eventType = input.eventType || "email_event";
  const category = input.category || "all";
  const attemptCount = Math.max(1, Math.round(input.attemptCount || 1));
  const idempotencyKey = input.idempotencyKey || null;

  const enabled = process.env.EMAIL_ENABLED === "true";
  if (!enabled) {
    await insertEmailLog({
      event_type: eventType,
      category,
      recipient: input.to,
      subject: input.subject,
      status: "skipped",
      error_code: "EMAIL_DISABLED",
      error: "EMAIL_ENABLED is not true",
      idempotency_key: idempotencyKey,
      attempt_count: attemptCount,
      meta: input.meta,
    });
    return {
      ok: true,
      skipped: true,
      status: "skipped",
      retryable: false,
      reason: "skipped_disabled",
    };
  }

  if (category === "marketplace" && process.env.EMAIL_MARKETPLACE_EVENTS !== "true") {
    await insertEmailLog({
      event_type: eventType,
      category,
      recipient: input.to,
      subject: input.subject,
      status: "skipped",
      error_code: "CATEGORY_DISABLED",
      error: "EMAIL_MARKETPLACE_EVENTS is not true",
      idempotency_key: idempotencyKey,
      attempt_count: attemptCount,
      meta: input.meta,
    });
    return {
      ok: true,
      skipped: true,
      status: "skipped",
      retryable: false,
      reason: "skipped_category_flag",
    };
  }
  if (category === "invites" && process.env.EMAIL_INVITES !== "true") {
    await insertEmailLog({
      event_type: eventType,
      category,
      recipient: input.to,
      subject: input.subject,
      status: "skipped",
      error_code: "CATEGORY_DISABLED",
      error: "EMAIL_INVITES is not true",
      idempotency_key: idempotencyKey,
      attempt_count: attemptCount,
      meta: input.meta,
    });
    return {
      ok: true,
      skipped: true,
      status: "skipped",
      retryable: false,
      reason: "skipped_category_flag",
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = input.from || process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    await insertEmailLog({
      event_type: eventType,
      category,
      recipient: input.to,
      subject: input.subject,
      status: "skipped",
      error_code: "MISSING_CONFIG",
      error: "RESEND_API_KEY or EMAIL_FROM missing",
      idempotency_key: idempotencyKey,
      attempt_count: attemptCount,
      meta: input.meta,
    });
    console.warn("[email] delivery_skipped missing_api_key_or_from");
    return {
      ok: true,
      skipped: true,
      status: "skipped",
      retryable: false,
      reason: "skipped_missing_config",
    };
  }

  // Idempotency guard to prevent duplicate successful sends.
  if (idempotencyKey) {
    const admin = createServiceRoleClient();
    if (admin) {
      try {
        const { data: existing } = await admin
          .from("email_logs")
          .select("id,status")
          .eq("idempotency_key", idempotencyKey)
          .in("status", ["queued", "sent"])
          .limit(1);
        if ((existing || []).length > 0) {
          await insertEmailLog({
            event_type: eventType,
            category,
            recipient: input.to,
            subject: input.subject,
            status: "skipped",
            error_code: "DUPLICATE",
            error: "Skipped due to idempotency guard",
            idempotency_key: idempotencyKey,
            attempt_count: attemptCount,
            meta: input.meta,
          });
          return {
            ok: true,
            skipped: true,
            status: "skipped",
            retryable: false,
            reason: "skipped_duplicate",
          };
        }
      } catch (e) {
        // If dedupe lookup fails, we still send the email.
        console.warn("[email] idempotency_guard_lookup_failed", {
          error: e instanceof Error ? e.message : String(e),
          idempotencyKey,
        });
      }
    }
  }

  try {
    const resend = new Resend(apiKey);
    const response = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    const providerMessageId =
      (response as { data?: { id?: string } }).data?.id ||
      undefined;
    await insertEmailLog({
      event_type: eventType,
      category,
      recipient: input.to,
      subject: input.subject,
      status: "sent",
      provider_message_id: providerMessageId || null,
      retryable: false,
      attempt_count: attemptCount,
      next_retry_at: null,
      idempotency_key: idempotencyKey,
      meta: {
        ...(input.meta || {}),
        payload: {
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
          category,
          eventType,
          idempotencyKey,
        },
      },
    });

    return {
      ok: true,
      status: "sent",
      retryable: false,
      reason: "sent",
      providerMessageId,
    };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    const retryable = attemptCount < 3;
    const retryAt = retryable ? nextRetryAt(attemptCount) : null;
    console.warn("[email] delivery_failed", {
      error: errorMessage,
      to: input.to,
      subject: input.subject,
    });
    await insertEmailLog({
      event_type: eventType,
      category,
      recipient: input.to,
      subject: input.subject,
      status: "failed",
      error: errorMessage,
      error_code: "PROVIDER_ERROR",
      retryable,
      attempt_count: attemptCount,
      next_retry_at: retryAt,
      idempotency_key: idempotencyKey,
      meta: {
        ...(input.meta || {}),
        payload: {
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
          category,
          eventType,
          idempotencyKey,
        },
      },
    });
    return {
      ok: false,
      status: "failed",
      retryable,
      reason: "failed_provider",
      errorCode: "PROVIDER_ERROR",
      errorMessage,
    };
  }
}

