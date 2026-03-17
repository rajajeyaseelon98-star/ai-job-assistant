import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCareerDiagnosis } from "@/lib/careerCoach";

/**
 * GET /api/career-coach — Full career diagnosis
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const diagnosis = await getCareerDiagnosis(user.id);
  return NextResponse.json(diagnosis);
}
