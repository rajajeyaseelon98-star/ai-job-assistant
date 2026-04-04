import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createNotificationForUser } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateTextLength, isValidUUID } from "@/lib/validation";

function previewMessage(text: string, max = 160): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const unread = url.searchParams.get("unread");

  const supabase = await createClient();
  let query = supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (unread === "true") {
    query = query.eq("receiver_id", user.id).eq("is_read", false);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });

  const messages = data || [];
  const peerIds = [
    ...new Set(
      messages.map((m) => (m.sender_id === user.id ? m.receiver_id : m.sender_id) as string)
    ),
  ];

  let peer_profiles: Record<string, { name: string | null; avatar_url: string | null }> = {};
  if (peerIds.length > 0) {
    const { data: rows, error: rpcErr } = await supabase.rpc("messaging_peer_profiles", {
      p_peer_ids: peerIds,
    });
    if (rpcErr) {
      console.error("messaging_peer_profiles:", rpcErr);
      return NextResponse.json({ error: "Failed to load message contacts" }, { status: 500 });
    }
    for (const r of rows ?? []) {
      const row = r as { id: string; name: string | null; avatar_url: string | null };
      peer_profiles[row.id] = { name: row.name, avatar_url: row.avatar_url };
    }
  }

  return NextResponse.json({ messages, peer_profiles });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { receiver_id, job_id, subject, content, template_name } = body as {
    receiver_id?: string;
    job_id?: string;
    subject?: string;
    content?: string;
    template_name?: string;
  };

  if (!receiver_id) {
    return NextResponse.json({ error: "receiver_id is required" }, { status: 400 });
  }

  if (!isValidUUID(receiver_id)) {
    return NextResponse.json({ error: "Invalid receiver_id" }, { status: 400 });
  }

  const contentVal = validateTextLength(content, 5000, "content");
  if (!contentVal.valid) return NextResponse.json({ error: contentVal.error }, { status: 400 });

  const supabase = await createClient();

  // Use SECURITY DEFINER RPC — not a plain SELECT on users: RLS allows recruiters to read
  // job_seeker rows but not vice versa, so job seekers would get "Recipient not found" when
  // replying to a recruiter if we queried users directly.
  const { data: receiverRoleRaw, error: recvErr } = await supabase.rpc("user_role_for_id", {
    p_user_id: receiver_id,
  });

  if (recvErr) {
    console.error("user_role_for_id:", recvErr);
    return NextResponse.json(
      { error: "Failed to validate recipient" },
      { status: 500 }
    );
  }
  if (receiverRoleRaw == null || receiverRoleRaw === "") {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }

  const senderRole = user.profile?.role ?? "job_seeker";
  const receiverRole = receiverRoleRaw as string;

  if (senderRole === "recruiter" && receiverRole !== "job_seeker") {
    return NextResponse.json(
      { error: "Recruiters can only message job seeker accounts." },
      { status: 403 }
    );
  }
  if (senderRole === "job_seeker" && receiverRole !== "recruiter") {
    return NextResponse.json(
      { error: "You can only message recruiter accounts." },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id,
      job_id: job_id || null,
      subject: subject?.trim().slice(0, 200) || null,
      content: contentVal.text.slice(0, 5000),
      template_name: template_name?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  const senderLabel =
    (user.profile?.name && user.profile.name.trim()) ||
    user.email?.split("@")[0] ||
    "Someone";
  const subj = typeof subject === "string" ? subject.trim() : "";
  const title = subj ? subj.slice(0, 200) : `New message from ${senderLabel}`;

  await createNotificationForUser(
    receiver_id,
    "message",
    title,
    previewMessage(contentVal.text),
    {
      message_id: data.id,
      sender_id: user.id,
      job_id: job_id || null,
    }
  );

  return NextResponse.json(data, { status: 201 });
}
