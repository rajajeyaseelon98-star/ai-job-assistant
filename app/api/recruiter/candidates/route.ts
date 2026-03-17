import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
  }

  const url = new URL(request.url);
  const skills = url.searchParams.get("skills");
  const experience = url.searchParams.get("experience");
  const location = url.searchParams.get("location");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

  const supabase = await createClient();

  // Search candidates who have resume data
  let query = supabase
    .from("users")
    .select(`
      id, email, name, created_at,
      resumes(id, parsed_text, created_at),
      user_preferences(experience_level, preferred_role, preferred_location, salary_expectation)
    `)
    .eq("role", "job_seeker")
    .limit(limit);

  // If location filter, try to match against user_preferences
  if (location) {
    // Can't do deep filter easily, will filter in code
  }

  const { data: candidates, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  // Filter and shape results
  let results = (candidates || [])
    .filter((c) => {
      // Must have at least one resume with parsed text
      const resumes = c.resumes as Record<string, unknown>[];
      return resumes && resumes.length > 0 && resumes.some((r) => r.parsed_text);
    })
    .map((c) => {
      const resumes = c.resumes as Record<string, unknown>[];
      const latestResume = resumes.sort(
        (a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
      )[0];
      const prefs = Array.isArray(c.user_preferences) ? c.user_preferences[0] : c.user_preferences;

      return {
        id: c.id,
        email: c.email,
        name: c.name,
        resume_id: latestResume?.id || null,
        resume_preview: latestResume?.parsed_text
          ? (latestResume.parsed_text as string).slice(0, 300)
          : null,
        experience_level: String((prefs as Record<string, unknown>)?.experience_level || "") || null,
        preferred_role: String((prefs as Record<string, unknown>)?.preferred_role || "") || null,
        preferred_location: String((prefs as Record<string, unknown>)?.preferred_location || "") || null,
        salary_expectation: String((prefs as Record<string, unknown>)?.salary_expectation || "") || null,
        created_at: c.created_at,
      };
    });

  // Apply text-based filters
  if (skills) {
    const skillList = skills.toLowerCase().split(",").map((s) => s.trim());
    results = results.filter((c) => {
      const text = (c.resume_preview || "").toLowerCase();
      return skillList.some((skill) => text.includes(skill));
    });
  }

  if (location) {
    const loc = location.toLowerCase();
    results = results.filter((c) => {
      return (
        (c.preferred_location || "").toLowerCase().includes(loc) ||
        (c.resume_preview || "").toLowerCase().includes(loc)
      );
    });
  }

  if (experience) {
    results = results.filter((c) => c.experience_level === experience);
  }

  return NextResponse.json(results);
}
