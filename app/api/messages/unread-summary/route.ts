import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Unread inbound message counts per conversation partner (sender_id → count).
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("sender_id")
    .eq("receiver_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("[messages/unread-summary]", error.message);
    return NextResponse.json({ error: "Failed to load unread summary" }, { status: 500 });
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const sid = row.sender_id as string;
    counts[sid] = (counts[sid] ?? 0) + 1;
  }

  return NextResponse.json({ counts });
}
