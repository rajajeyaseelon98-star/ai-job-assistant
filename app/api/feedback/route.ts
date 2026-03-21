import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { feature, resultId, type } = body as {
    feature?: string;
    resultId?: string;
    type?: string;
  };

  if (!feature || typeof feature !== "string") {
    return NextResponse.json({ error: "feature is required" }, { status: 400 });
  }
  if (type !== "up" && type !== "down") {
    return NextResponse.json({ error: "type must be 'up' or 'down'" }, { status: 400 });
  }

  const supabase = await createClient();

  // Log feedback — best-effort, table may not exist yet
  try {
    await supabase.from("feedback").insert({
      user_id: user.id,
      feature: feature.slice(0, 100),
      result_id: resultId?.slice(0, 100) || null,
      type,
    });
  } catch {
    // Table may not exist — silently ignore
  }

  return NextResponse.json({ success: true });
}
