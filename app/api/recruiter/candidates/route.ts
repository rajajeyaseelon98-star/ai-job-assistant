import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Max job_seeker rows read from DB per request (prevents unbounded scans). */
const MAX_USERS_SCAN = 5000;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
/** Characters of parsed resume text exposed for list cards and skill/location filtering. */
const RESUME_PREVIEW_CHARS = 500;

type CandidateRow = {
  id: string;
  email: string;
  name: string | null;
  resume_id: string | null;
  resume_preview: string | null;
  /** True if the user has at least one resume row (may have no parsed text yet). */
  has_resume: boolean;
  experience_level: string | null;
  preferred_role: string | null;
  preferred_location: string | null;
  salary_expectation: string | null;
  created_at: string;
};

function normalizeResumes(c: Record<string, unknown>): Record<string, unknown>[] {
  const raw = c.resumes;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") return [raw as Record<string, unknown>];
  return [];
}

function shapeCandidates(
  candidates: Record<string, unknown>[]
): CandidateRow[] {
  return (candidates || []).map((c) => {
    const resumes = normalizeResumes(c);
    const hasResume = resumes.length > 0;
    const sorted = [...resumes].sort(
      (a, b) =>
        new Date((b as Record<string, unknown>).created_at as string).getTime() -
        new Date((a as Record<string, unknown>).created_at as string).getTime()
    );
    const latestWithText = sorted.find((r) => (r as Record<string, unknown>).parsed_text);
    const latestResume = (latestWithText ?? sorted[0]) as Record<string, unknown> | undefined;
    const prefs = Array.isArray(c.user_preferences) ? c.user_preferences[0] : c.user_preferences;

    return {
      id: c.id as string,
      email: c.email as string,
      name: (c.name as string | null) ?? null,
      resume_id: (latestResume?.id as string) || null,
      resume_preview: latestResume?.parsed_text
        ? String(latestResume.parsed_text).slice(0, RESUME_PREVIEW_CHARS)
        : null,
      has_resume: hasResume,
      experience_level: String((prefs as Record<string, unknown>)?.experience_level || "") || null,
      preferred_role: String((prefs as Record<string, unknown>)?.preferred_role || "") || null,
      preferred_location: String((prefs as Record<string, unknown>)?.preferred_location || "") || null,
      salary_expectation: String((prefs as Record<string, unknown>)?.salary_expectation || "") || null,
      created_at: c.created_at as string,
    };
  });
}

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

  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(url.searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  );

  const supabase = await createClient();

  const { data: candidates, error } = await supabase
    .from("users")
    .select(`
      id, email, name, created_at,
      resumes(id, parsed_text, created_at),
      user_preferences(experience_level, preferred_role, preferred_location, salary_expectation)
    `)
    .eq("role", "job_seeker")
    .order("created_at", { ascending: false })
    .limit(MAX_USERS_SCAN);

  if (error) {
    console.error("[recruiter/candidates]", error.message);
    return NextResponse.json({ error: "Search failed", detail: error.message }, { status: 500 });
  }

  const scanHitCap = (candidates || []).length >= MAX_USERS_SCAN;

  let results = shapeCandidates(candidates || []);

  if (skills) {
    const skillList = skills.toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
    if (skillList.length > 0) {
      results = results.filter((c) => {
        const text = (c.resume_preview || "").toLowerCase();
        return skillList.some((skill) => text.includes(skill));
      });
    }
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

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;
  const pageRows = results.slice(offset, offset + pageSize);

  const body = {
    candidates: pageRows,
    page: safePage,
    pageSize,
    total,
    totalPages,
    truncated: scanHitCap,
    limits: {
      max_job_seekers_scanned: MAX_USERS_SCAN,
      resume_preview_chars: RESUME_PREVIEW_CHARS,
      max_page_size: MAX_PAGE_SIZE,
    },
    /** Honest scope for clients — not full-text search across all profiles. */
    search_quality: {
      model: "recent_users_then_in_memory_filter",
      note:
        "Filters apply to the newest job_seeker rows up to the scan cap, using a short resume text prefix for skills/location — not exhaustive search over the entire user base.",
    },
  };

  return NextResponse.json(body);
}
