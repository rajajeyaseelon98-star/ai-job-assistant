import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getCareerDiagnosis } from "@/lib/careerCoach";

/**
 * GET /api/career-coach — Full career diagnosis
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const diagnosis = await getCareerDiagnosis(user.id);
  return NextResponse.json(diagnosis);
}
