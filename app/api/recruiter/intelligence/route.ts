import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getRecruiterIntelligence } from "@/lib/recruiterIntelligence";

/** GET /api/recruiter/intelligence — Hiring intelligence dashboard data */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
  }

  try {
    const intel = await getRecruiterIntelligence(user.id);
    return NextResponse.json(intel);
  } catch (err) {
    console.error("Recruiter intelligence error:", err);
    return NextResponse.json({ error: "Failed to load intelligence" }, { status: 500 });
  }
}
