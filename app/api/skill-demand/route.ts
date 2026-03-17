import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getSkillDemandDashboard } from "@/lib/skillDemand";
import { createClient } from "@/lib/supabase/server";

/** GET /api/skill-demand — Get skill demand dashboard */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's skills from candidate_skills table
    const supabase = await createClient();
    const { data: userSkills } = await supabase
      .from("candidate_skills")
      .select("skill")
      .eq("user_id", user.id);

    const skills = (userSkills || []).map((s) => s.skill);
    const dashboard = await getSkillDemandDashboard(skills);
    return NextResponse.json(dashboard);
  } catch (err) {
    console.error("Skill demand error:", err);
    return NextResponse.json({ error: "Failed to load skill demand" }, { status: 500 });
  }
}
