import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { token } = body as { token?: string };
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: invite, error: inviteErr } = await supabase
    .from("company_invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (inviteErr) return NextResponse.json({ error: "Failed to load invite" }, { status: 500 });
  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (invite.accepted_at) return NextResponse.json({ error: "Invite already accepted" }, { status: 409 });

  const expiresAt = new Date(invite.expires_at as string).getTime();
  if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  }

  // If the invite was sent to an email, ensure this user matches the invited email for safety.
  const invitedEmail = String(invite.email || "").trim().toLowerCase();
  if (invitedEmail && user.email.trim().toLowerCase() !== invitedEmail) {
    return NextResponse.json({ error: "This invite is not for your account" }, { status: 403 });
  }

  const companyId = String(invite.company_id);
  const membershipRole = (invite.role as "admin" | "recruiter") === "admin" ? "admin" : "recruiter";

  // Enforce plan limits: team member cap.
  const [{ data: company }, { count: activeMembers }] = await Promise.all([
    supabase.from("companies").select("id,max_team_members").eq("id", companyId).maybeSingle(),
    supabase
      .from("company_memberships")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "active"),
  ]);
  const maxTeamMembers = (company as { max_team_members?: number } | null | undefined)?.max_team_members ?? 3;
  if (maxTeamMembers !== -1 && (activeMembers ?? 0) >= maxTeamMembers) {
    return NextResponse.json(
      { error: `Plan limit reached: max ${maxTeamMembers} team members.` },
      { status: 402 }
    );
  }

  // Create membership (RLS allows self insert; company_invites update requires admin, so we just leave accepted_at
  // to be updated by a company admin flow later. For now we don't require accepted_at to be set for functionality.
  const { error: memberErr } = await supabase.from("company_memberships").insert({
    company_id: companyId,
    user_id: user.id,
    role: membershipRole,
    status: "active",
    invited_by: invite.invited_by,
  });
  if (memberErr) return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });

  // Best-effort mark accepted_at (may fail if RLS restricts; non-fatal).
  await supabase
    .from("company_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  return NextResponse.json({ ok: true, company_id: companyId, role: membershipRole });
}

