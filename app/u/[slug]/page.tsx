import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Award, TrendingUp, Briefcase, GraduationCap } from "lucide-react";

interface Badge {
  skill_name: string;
  level: "beginner" | "intermediate" | "expert";
  years_experience: number;
  verified: boolean;
}

const LEVEL_COLORS = {
  expert: "bg-green-100 text-green-700 border-green-300",
  intermediate: "bg-blue-100 text-blue-700 border-blue-300",
  beginner: "bg-gray-100 text-gray-600 border-gray-300",
};

const LEVEL_LABELS = {
  expert: "Expert",
  intermediate: "Intermediate",
  beginner: "Beginner",
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch public profile
  const { data: user } = await supabase
    .from("users")
    .select("id, name, headline, bio, avatar_url, profile_visible, profile_strength, public_slug")
    .eq("public_slug", slug)
    .eq("profile_visible", true)
    .single();

  if (!user) notFound();

  // Fetch skill badges
  const { data: badges } = await supabase
    .from("skill_badges")
    .select("skill_name, level, years_experience, verified")
    .eq("user_id", user.id)
    .order("years_experience", { ascending: false })
    .limit(20);

  // Fetch best ATS score
  const { data: bestAnalysis } = await supabase
    .from("resume_analysis")
    .select("score, resumes!inner(user_id)")
    .eq("resumes.user_id", user.id)
    .order("score", { ascending: false })
    .limit(1)
    .single();

  const atsScore = bestAnalysis?.score || null;
  const skillBadges = (badges || []) as Badge[];

  const expertSkills = skillBadges.filter((b) => b.level === "expert");
  const intermediateSkills = skillBadges.filter((b) => b.level === "intermediate");
  const beginnerSkills = skillBadges.filter((b) => b.level === "beginner");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Profile Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-xl sm:text-2xl font-bold text-white shrink-0">
              {(user.name || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">{user.name || "Professional"}</h1>
              {user.headline && (
                <p className="text-sm text-gray-600 mt-0.5">{user.headline}</p>
              )}
              {user.bio && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{user.bio}</p>
              )}
            </div>
          </div>

          {/* Profile Strength + ATS Score */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {/* Profile Strength */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Profile Strength
                </span>
                <span className="text-xs font-bold text-gray-900">{user.profile_strength}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full transition-all ${
                    user.profile_strength >= 70 ? "bg-green-500" :
                    user.profile_strength >= 40 ? "bg-yellow-500" : "bg-red-400"
                  }`}
                  style={{ width: `${user.profile_strength}%` }}
                />
              </div>
            </div>

            {/* ATS Score */}
            {atsScore !== null && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" /> ATS Score
                  </span>
                  <span className={`text-xs font-bold ${
                    atsScore >= 75 ? "text-green-600" : atsScore >= 50 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {atsScore}/100
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full ${
                      atsScore >= 75 ? "bg-green-500" : atsScore >= 50 ? "bg-yellow-500" : "bg-red-400"
                    }`}
                    style={{ width: `${atsScore}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Skill Badges */}
        {skillBadges.length > 0 && (
          <div className="mt-4 sm:mt-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2 mb-3 sm:mb-4">
              <GraduationCap className="h-5 w-5" /> Skills & Expertise
            </h2>

            {expertSkills.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Expert</h3>
                <div className="flex flex-wrap gap-2">
                  {expertSkills.map((badge) => (
                    <span
                      key={badge.skill_name}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${LEVEL_COLORS.expert}`}
                    >
                      {badge.skill_name}
                      <span className="text-[10px] opacity-70">
                        {badge.years_experience}y
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {intermediateSkills.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Intermediate</h3>
                <div className="flex flex-wrap gap-2">
                  {intermediateSkills.map((badge) => (
                    <span
                      key={badge.skill_name}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${LEVEL_COLORS.intermediate}`}
                    >
                      {badge.skill_name}
                      <span className="text-[10px] opacity-70">
                        {badge.years_experience}y
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {beginnerSkills.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Learning</h3>
                <div className="flex flex-wrap gap-2">
                  {beginnerSkills.map((badge) => (
                    <span
                      key={badge.skill_name}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${LEVEL_COLORS.beginner}`}
                    >
                      {badge.skill_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 sm:mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-6 text-center">
          <Briefcase className="mx-auto h-7 w-7 sm:h-8 sm:w-8 text-primary mb-2" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Get Your Own AI Career Profile</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 mb-3 sm:mb-4">
            Upload your resume, get an ATS score, skill badges, and auto-apply to jobs.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 min-h-[44px] w-full sm:w-auto active:scale-[0.98] transition-transform"
          >
            Create Free Account
          </a>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Powered by AI Job Assistant
        </p>
      </div>
    </div>
  );
}
