import crypto from "crypto";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type ResendWebhookEvent = {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
    subject?: string;
    tags?: Record<string, string>;
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

function verifySvixSignature(args: {
  payload: string;
  secret: string;
  svixId: string;
  svixTimestamp: string;
  svixSignature: string;
}): { ok: true } | { ok: false; reason: string } {
  const toleranceSeconds = 5 * 60;

  let ts = 0;
  try {
    ts = Number(args.svixTimestamp);
    if (!Number.isFinite(ts)) return { ok: false, reason: "invalid_timestamp" };
  } catch {
    return { ok: false, reason: "invalid_timestamp" };
  }

  const now = Math.floor(Date.now() / 1000);
  const delta = Math.abs(now - Math.floor(ts));
  if (delta > toleranceSeconds) return { ok: false, reason: "timestamp_out_of_tolerance" };

  const signedContent = `${args.svixId}.${args.svixTimestamp}.${args.payload}`;
  const secretBase64 = args.secret.startsWith("whsec_") ? args.secret.slice("whsec_".length) : args.secret;

  let key: Buffer;
  try {
    key = Buffer.from(secretBase64, "base64");
  } catch {
    return { ok: false, reason: "invalid_secret" };
  }
  if (!key.length) return { ok: false, reason: "invalid_secret" };

  const expected = crypto.createHmac("sha256", key).update(signedContent).digest("base64");

  const candidates = args.svixSignature.split(" ");
  for (const candidate of candidates) {
    const parts = candidate.split(",", 2);
    if (parts.length !== 2) continue;
    const sig = parts[1] || "";
    try {
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) return { ok: true };
    } catch {
      // ignore
    }
  }

  return { ok: false, reason: "no_matching_signature" };
}

function lifecycleFromType(type: string | undefined) {
  if (!type) return null;
  if (type === "email.delivered") return { delivery_status: "delivered" as const, atField: "delivered_at" as const };
  if (type === "email.bounced") return { delivery_status: "bounced" as const, atField: "bounced_at" as const };
  if (type === "email.complained") return { delivery_status: "complaint" as const, atField: "complained_at" as const };
  return null;
}

function rankDeliveryStatus(status: string | null | undefined) {
  // Higher wins. We never want to downgrade bounced/complaint back to delivered.
  if (status === "complaint") return 30;
  if (status === "bounced") return 20;
  if (status === "delivered") return 10;
  return 0;
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "RESEND_WEBHOOK_SECRET missing" }, { status: 500 });
  }

  const payload = await request.text();
  const svixId = request.headers.get("svix-id") || "";
  const svixTimestamp = request.headers.get("svix-timestamp") || "";
  const svixSignature = request.headers.get("svix-signature") || "";

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const verified = verifySvixSignature({
    payload,
    secret,
    svixId,
    svixTimestamp,
    svixSignature,
  });
  if (!verified.ok) {
    return NextResponse.json({ error: "Invalid webhook", reason: verified.reason }, { status: 400 });
  }

  let event: ResendWebhookEvent | null = null;
  try {
    event = JSON.parse(payload) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const emailId = typeof event?.data?.email_id === "string" ? event.data.email_id : null;
  const lifecycle = lifecycleFromType(typeof event?.type === "string" ? event.type : undefined);

  // We always ack quickly; DB writes are best-effort.
  if (!emailId || !lifecycle) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const { data: existing } = await admin
      .from("email_logs")
      .select("id,delivery_status")
      .eq("provider_message_id", emailId)
      .order("created_at", { ascending: false })
      .limit(1);

    const row = (existing || [])[0] as { id?: string; delivery_status?: string } | undefined;
    if (!row?.id) return NextResponse.json({ ok: true, updated: 0 });

    const incomingRank = rankDeliveryStatus(lifecycle.delivery_status);
    const currentRank = rankDeliveryStatus(row.delivery_status);
    const shouldUpdateStatus = incomingRank >= currentRank;

    const updates: Record<string, unknown> = {
      webhook_last_event: event.type || null,
      webhook_last_at: event.created_at || new Date().toISOString(),
    };

    if (shouldUpdateStatus) {
      updates.delivery_status = lifecycle.delivery_status;
      updates[lifecycle.atField] = event.created_at || new Date().toISOString();
    }

    await admin.from("email_logs").update(updates).eq("id", row.id);
    return NextResponse.json({ ok: true, updated: 1 });
  } catch (e) {
    console.warn("[email] resend_webhook_update_failed", {
      error: e instanceof Error ? e.message : String(e),
      emailId,
      type: event.type,
    });
    return NextResponse.json({ ok: true, updated: 0 });
  }
}

