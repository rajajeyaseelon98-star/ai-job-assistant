import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getTopCandidates } from "@/lib/candidateBoost";

/** GET /api/recruiter/top-candidates — Get top-ranked candidates */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const skillsParam = searchParams.get("skills");
  const skills = skillsParam ? skillsParam.split(",").map((s) => s.trim()) : undefined;

  try {
    const candidates = await getTopCandidates(limit, skills);
    return NextResponse.json(candidates);
  } catch (err) {
    console.error("Top candidates error:", err);
    return NextResponse.json({ error: "Failed to load candidates" }, { status: 500 });
  }
}
