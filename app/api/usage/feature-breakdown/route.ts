import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getAiUsageFeatureBreakdown } from "@/lib/aiUsageQueries";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await getAiUsageFeatureBreakdown(user.id);
    return NextResponse.json({ rows });
  } catch (e) {
    const detail = e instanceof Error ? e.message : "Unknown usage breakdown error";
    console.error("[usage-feature-breakdown] failed:", detail);
    return NextResponse.json({ error: "Failed to load usage feature breakdown", detail }, { status: 500 });
  }
}

