import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { generateDailyReport } from "@/lib/dailyReport";

/** GET /api/daily-report — Get today's daily report for current user */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await generateDailyReport(user.id);
    return NextResponse.json(report);
  } catch (err) {
    console.error("Daily report error:", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
