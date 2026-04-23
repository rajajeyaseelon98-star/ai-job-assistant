import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getAiUsageHistory } from "@/lib/aiUsageQueries";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limitRaw = Number(searchParams.get("limit") || "50");
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, limitRaw)) : 50;

  try {
    const rows = await getAiUsageHistory(user.id, limit);
    return NextResponse.json({ rows });
  } catch (e) {
    const detail = e instanceof Error ? e.message : "Unknown usage history error";
    console.error("[usage-history] failed:", detail);
    return NextResponse.json({ error: "Failed to load usage history", detail }, { status: 500 });
  }
}

