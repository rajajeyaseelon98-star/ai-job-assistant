import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkRecipientSearchRateLimit } from "@/lib/rateLimit";

type Row = { id: string; name: string | null; email: string; role: string };

/** GET ?q= — search opposite role by name/email (min 2 chars). For compose "To" field. */
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] as Row[] });
  }

  const rl = await checkRecipientSearchRateLimit(user.id);
  if (!rl.allowed) {
    const retrySec = Math.max(1, Math.ceil(rl.retryAfterMs / 1000));
    console.warn(
      JSON.stringify({
        event: "recipient_search_rate_limited",
        userId: user.id,
        retryAfterMs: rl.retryAfterMs,
        path: "/api/messages/recipient-search",
      })
    );
    return NextResponse.json(
      { error: "Too many searches. Try again in a moment." },
      { status: 429, headers: { "Retry-After": String(retrySec) } }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_message_recipients", {
    p_query: q,
    p_limit: 15,
  });

  if (error) {
    console.error("search_message_recipients:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  const rows = (data ?? []) as Row[];
  return NextResponse.json({ results: rows });
}
