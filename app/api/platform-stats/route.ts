import { NextResponse } from "next/server";
import { getPlatformStats } from "@/lib/socialProof";

/** GET /api/platform-stats — Public platform statistics for social proof */
export async function GET() {
  try {
    const stats = await getPlatformStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("Platform stats error:", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
