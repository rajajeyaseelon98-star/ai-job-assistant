import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/validation";

/** POST /api/messages/mark-read — body: { peer_id: string } — marks inbound messages from peer as read. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { peer_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const peerId = body.peer_id?.trim();
  if (!peerId || !isValidUUID(peerId)) {
    return NextResponse.json({ error: "peer_id is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const readAt = new Date().toISOString();
  const { error } = await supabase
    .from("messages")
    .update({ is_read: true, read_at: readAt })
    .eq("receiver_id", user.id)
    .eq("sender_id", peerId)
    .eq("is_read", false);

  if (error) {
    console.error("mark-read error:", error);
    return NextResponse.json({ error: "Failed to update messages" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
