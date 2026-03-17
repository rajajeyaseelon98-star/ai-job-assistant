import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getSalaryIntelligence } from "@/lib/salaryIntelligence";

/** GET /api/salary-intelligence — Get salary intelligence for a role */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const jobTitle = searchParams.get("title");
  const location = searchParams.get("location") || undefined;
  const experience = searchParams.get("experience")
    ? parseInt(searchParams.get("experience")!)
    : undefined;

  if (!jobTitle) {
    return NextResponse.json({ error: "title parameter required" }, { status: 400 });
  }

  try {
    const insight = await getSalaryIntelligence(jobTitle, location, experience);
    return NextResponse.json(insight);
  } catch (err) {
    console.error("Salary intelligence error:", err);
    return NextResponse.json({ error: "Failed to load salary data" }, { status: 500 });
  }
}
