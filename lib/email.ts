import { Resend } from "resend";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  /** Optional feature gate category (e.g. "marketplace") */
  category?: "marketplace" | "invites" | "all";
};

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; skipped?: boolean }> {
  const enabled = process.env.EMAIL_ENABLED === "true";
  if (!enabled) return { ok: true, skipped: true };

  const category = input.category || "all";
  if (category === "marketplace" && process.env.EMAIL_MARKETPLACE_EVENTS !== "true") {
    return { ok: true, skipped: true };
  }
  if (category === "invites" && process.env.EMAIL_INVITES !== "true") {
    return { ok: true, skipped: true };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = input.from || process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn("[email] delivery_skipped missing_api_key_or_from");
    return { ok: true, skipped: true };
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { ok: true };
  } catch (e) {
    console.warn("[email] delivery_failed", {
      error: e instanceof Error ? e.message : String(e),
      to: input.to,
      subject: input.subject,
    });
    return { ok: false };
  }
}

