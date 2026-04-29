import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createNotificationForUser } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  isAttachmentPathOwnedBySender,
  messagesWithSignedAttachmentUrls,
} from "@/lib/message-attachments";
import { validateTextLength, isValidUUID } from "@/lib/validation";

function previewMessage(text: string, max = 160): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

const DEFAULT_MSG_LIMIT = 100;
const MAX_MSG_LIMIT = 200;

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const unread = url.searchParams.get("unread");
  const before = url.searchParams.get("before")?.trim() || null;
  const limitRaw = parseInt(url.searchParams.get("limit") || String(DEFAULT_MSG_LIMIT), 10);
  const pageLimit = Math.min(
    MAX_MSG_LIMIT,
    Math.max(1, Number.isFinite(limitRaw) ? limitRaw : DEFAULT_MSG_LIMIT)
  );
  const fetchLimit = pageLimit + 1;

  const supabase = await createClient();
  let query = supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (unread === "true") {
    query = query.eq("receiver_id", user.id).eq("is_read", false);
  }

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });

  const rows = await messagesWithSignedAttachmentUrls(supabase, data || []);
  const hasMore = rows.length > pageLimit;
  const messages = hasMore ? rows.slice(0, pageLimit) : rows;
  const next_before =
    hasMore && messages.length > 0 ? (messages[messages.length - 1].created_at as string) : null;
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

  return NextResponse.json({
    messages,
    peer_profiles,
    has_more: hasMore,
    next_before: next_before,
    /** Hint for clients: inbox lists are paginated; not every message may be loaded yet. */
    partial: true,
  });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  const requestId = crypto.randomUUID();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", requestId, retryable: false }, { status: 401 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests.", requestId, retryable: true, nextAction: "Retry in a moment" },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", requestId, retryable: false }, { status: 400 });
  }

  const { receiver_id, job_id, subject, content, template_name, attachment_path, attachment_name, attachment_mime } =
    body as {
      receiver_id?: string;
      job_id?: string;
      subject?: string;
      content?: string;
      template_name?: string;
      attachment_path?: string | null;
      attachment_name?: string | null;
      attachment_mime?: string | null;
    };

  if (!receiver_id) {
    return NextResponse.json({ error: "receiver_id is required", requestId, retryable: false }, { status: 400 });
  }

  if (!isValidUUID(receiver_id)) {
    return NextResponse.json({ error: "Invalid receiver_id", requestId, retryable: false }, { status: 400 });
  }

  const rawContent = typeof content === "string" ? content : "";
  const pathTrim = typeof attachment_path === "string" ? attachment_path.trim() : "";
  const hasAttachment = Boolean(pathTrim);

  let contentText: string;
  if (!hasAttachment) {
    const contentVal = validateTextLength(content, 5000, "content");
    if (!contentVal.valid) {
      return NextResponse.json({ error: contentVal.error, requestId, retryable: false }, { status: 400 });
    }
    contentText = contentVal.text;
    if (!contentText) {
      return NextResponse.json({ error: "content is required", requestId, retryable: false }, { status: 400 });
    }
  } else {
    if (rawContent.length > 5000) {
      return NextResponse.json(
        { error: "content exceeds maximum length of 5000 characters", requestId, retryable: false },
        { status: 400 }
      );
    }
    if (!isAttachmentPathOwnedBySender(pathTrim, user.id)) {
      return NextResponse.json({ error: "Invalid attachment_path", requestId, retryable: false }, { status: 400 });
    }
    contentText = rawContent.trim().slice(0, 5000);
  }

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
      { error: "Failed to validate recipient", requestId, retryable: true, nextAction: "Retry send" },
      { status: 500 }
    );
  }
  if (receiverRoleRaw == null || receiverRoleRaw === "") {
    return NextResponse.json({ error: "Recipient not found", requestId, retryable: false }, { status: 404 });
  }

  const senderRole = user.profile?.role ?? "job_seeker";
  const receiverRole = receiverRoleRaw as string;

  if (senderRole === "recruiter" && receiverRole !== "job_seeker") {
    return NextResponse.json(
      {
        error: "Recruiters can only message job seeker accounts.",
        requestId,
        retryable: false,
      },
      { status: 403 }
    );
  }
  if (senderRole === "job_seeker" && receiverRole !== "recruiter") {
    return NextResponse.json(
      { error: "You can only message recruiter accounts.", requestId, retryable: false },
      { status: 403 }
    );
  }

  const nameTrim =
    typeof attachment_name === "string" && attachment_name.trim()
      ? attachment_name.trim().slice(0, 240)
      : null;
  const mimeTrim =
    typeof attachment_mime === "string" && attachment_mime.trim()
      ? attachment_mime.trim().slice(0, 120)
      : null;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id,
      job_id: job_id || null,
      subject: subject?.trim().slice(0, 200) || null,
      content: contentText || "(attachment)",
      template_name: template_name?.trim() || null,
      attachment_path: hasAttachment ? pathTrim : null,
      attachment_name: hasAttachment ? nameTrim : null,
      attachment_mime: hasAttachment ? mimeTrim : null,
    })
    .select()
    .single();

  if (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message", requestId, retryable: true, nextAction: "Retry send" },
      { status: 500 }
    );
  }

  const senderLabel =
    (user.profile?.name && user.profile.name.trim()) ||
    user.email?.split("@")[0] ||
    "Someone";
  const subj = typeof subject === "string" ? subject.trim() : "";
  const title = subj ? subj.slice(0, 200) : `New message from ${senderLabel}`;

  const previewBody = contentText || (hasAttachment ? "(attachment)" : "");
  const notificationQueued = await createNotificationForUser(
    receiver_id,
    "message",
    title,
    previewMessage(previewBody),
    {
      message_id: data.id,
      sender_id: user.id,
      job_id: job_id || null,
    }
  );

  const [enriched] = await messagesWithSignedAttachmentUrls(supabase, [data]);
  return NextResponse.json(
    {
      ...enriched,
      ok: true,
      message: "Message sent",
      messageId: data.id,
      sentAt: data.created_at,
      meta: {
        requestId,
        nextStep: "Monitor delivery state in this thread",
      },
      notificationQueued,
    },
    { status: 201 }
  );
}
