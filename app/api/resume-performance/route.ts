import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getResumePerformance, getHiringBenchmark } from "@/lib/resumePerformance";

/** GET /api/resume-performance — Resume Performance Index + Hiring Benchmark */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [performance, benchmark] = await Promise.all([
      getResumePerformance(user.id),
      getHiringBenchmark(user.id),
    ]);

    return NextResponse.json({ performance, benchmark });
  } catch (err) {
    console.error("Resume performance error:", err);
    return NextResponse.json({ error: "Failed to load performance data" }, { status: 500 });
  }
}
