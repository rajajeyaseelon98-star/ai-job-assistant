import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { messagesWithSignedAttachmentUrls } from "@/lib/message-attachments";
import { isValidUUID } from "@/lib/validation";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

/**
 * Full conversation with a single peer (independent of inbox pagination).
 * Query: peer_id (required), before (cursor, ISO), limit (default 100, max 200).
 */
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const peerId = url.searchParams.get("peer_id")?.trim() ?? "";
  if (!peerId || !isValidUUID(peerId)) {
    return NextResponse.json({ error: "peer_id is required and must be a valid UUID" }, { status: 400 });
  }
  if (peerId === user.id) {
    return NextResponse.json({ error: "Invalid peer" }, { status: 400 });
  }

  const before = url.searchParams.get("before")?.trim() || null;
  const limitRaw = parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT), 10);
  const pageLimit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.isFinite(limitRaw) ? limitRaw : DEFAULT_LIMIT)
  );
  const fetchLimit = pageLimit + 1;

  const supabase = await createClient();

  let query = supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[messages/thread]", error.message);
    return NextResponse.json({ error: "Failed to load thread" }, { status: 500 });
  }

  const signed = await messagesWithSignedAttachmentUrls(supabase, data || []);
  const hasMore = signed.length > pageLimit;
  const messages = hasMore ? signed.slice(0, pageLimit) : signed;
  const next_before =
    hasMore && messages.length > 0 ? (messages[messages.length - 1].created_at as string) : null;

  let peer_profiles: Record<string, { name: string | null; avatar_url: string | null }> = {};
  const { data: profileRows, error: rpcErr } = await supabase.rpc("messaging_peer_profiles", {
    p_peer_ids: [peerId],
  });
  if (rpcErr) {
    console.error("messaging_peer_profiles:", rpcErr);
    return NextResponse.json({ error: "Failed to load contact" }, { status: 500 });
  }
  for (const r of profileRows ?? []) {
    const row = r as { id: string; name: string | null; avatar_url: string | null };
    peer_profiles[row.id] = { name: row.name, avatar_url: row.avatar_url };
  }

  return NextResponse.json({
    messages,
    peer_profiles,
    has_more: hasMore,
    next_before,
    peer_id: peerId,
  });
}
