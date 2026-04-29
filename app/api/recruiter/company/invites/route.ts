import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAppBaseUrl } from "@/lib/appUrl";
import { sendEmail } from "@/lib/email";
import { companyInviteEmailTemplate } from "@/lib/emailTemplates";
import crypto from "crypto";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = await createClient();
  // Use company membership to discover company IDs, then list invites.
  const { data: memberships, error: mErr } = await supabase
    .from("company_memberships")
    .select("company_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (mErr) return NextResponse.json({ error: "Failed to load memberships" }, { status: 500 });
  const companyIds = (memberships || []).map((m) => (m as { company_id: string }).company_id).filter(Boolean);
  if (!companyIds.length) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("company_invites")
    .select("*")
    .in("company_id", companyIds)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to load invites" }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { company_id, email, role } = body as {
    company_id?: string;
    email?: string;
    role?: "admin" | "recruiter";
  };

  if (!company_id || typeof company_id !== "string") {
    return NextResponse.json({ error: "company_id is required" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (role !== "admin" && role !== "recruiter") {
    return NextResponse.json({ error: "role must be admin or recruiter" }, { status: 400 });
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 days

  const supabase = await createClient();

  // Enforce plan limits: team member cap (active members + pending invites).
  const [{ data: company }, { count: activeMembers }, { count: pendingInvites }] = await Promise.all([
    supabase.from("companies").select("id,max_team_members").eq("id", company_id).maybeSingle(),
    supabase
      .from("company_memberships")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company_id)
      .eq("status", "active"),
    supabase
      .from("company_invites")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company_id)
      .is("accepted_at", null),
  ]);
  const maxTeamMembers = (company as { max_team_members?: number } | null | undefined)?.max_team_members ?? 3;
  const used = (activeMembers ?? 0) + (pendingInvites ?? 0);
  if (maxTeamMembers !== -1 && used >= maxTeamMembers) {
    return NextResponse.json(
      { error: `Plan limit reached: max ${maxTeamMembers} team members (including pending invites).` },
      { status: 402 }
    );
  }

  const { data, error } = await supabase
    .from("company_invites")
    .insert({
      company_id,
      email: email.trim().toLowerCase(),
      role,
      token,
      expires_at: expiresAt,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }

  const baseUrl = await getAppBaseUrl();
  const inviteUrl = `${baseUrl}/recruiter/invite/accept?token=${encodeURIComponent(token)}`;

  // Best-effort email delivery (Phase 6).
  let emailQueued = false;
  try {
    const { data: companyRow } = await supabase
      .from("companies")
      .select("id,name")
      .eq("id", company_id)
      .maybeSingle();
    const companyName = String((companyRow as { name?: string } | null | undefined)?.name || "your company");
    const expiresHuman = new Date(expiresAt).toLocaleString();
    const tpl = companyInviteEmailTemplate({
      companyName,
      inviterEmail: user.email,
      inviteRole: role,
      acceptUrl: inviteUrl,
      expiresHuman,
    });
    const res = await sendEmail({
      to: email.trim().toLowerCase(),
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: "invites",
      eventType: "company_invite_created",
      idempotencyKey: `invite:${data.id}:recipient:${email.trim().toLowerCase()}`,
      meta: {
        company_id,
        invite_id: data.id,
        invited_by: user.id,
        role,
      },
    });
    emailQueued = res.ok && res.status === "sent";
  } catch (e) {
    console.warn("[invites] failed to queue invite email", {
      error: e instanceof Error ? e.message : String(e),
    });
  }

  return NextResponse.json(
    {
      invite: data,
      invite_url: inviteUrl,
      emailQueued,
    },
    { status: 201 }
  );
}

