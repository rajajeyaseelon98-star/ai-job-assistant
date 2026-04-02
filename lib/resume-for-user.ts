import type { SupabaseClient } from "@supabase/supabase-js";

export type ResumeTextResult =
  | { ok: true; text: string }
  | { ok: false; reason: "not_found" | "empty" };

/**
 * Loads parsed resume text for the authenticated user's resume row.
 * Used by cover-letter generation and job application flows.
 */
export async function getResumeParsedTextForUser(
  supabase: SupabaseClient,
  userId: string,
  resumeId: string
): Promise<ResumeTextResult> {
  const { data: resume, error } = await supabase
    .from("resumes")
    .select("id, parsed_text")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .single();

  if (error || !resume) {
    return { ok: false, reason: "not_found" };
  }

  const text = (resume.parsed_text ?? "").trim();
  if (!text) {
    return { ok: false, reason: "empty" };
  }

  return { ok: true, text };
}

/** For job applications: resume must exist; empty parsed_text is allowed (stored as null). */
export async function getResumeForJobApplication(
  supabase: SupabaseClient,
  userId: string,
  resumeId: string
): Promise<{ ok: false; reason: "not_found" } | { ok: true; text: string | null }> {
  const { data: resume, error } = await supabase
    .from("resumes")
    .select("id, parsed_text")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .single();

  if (error || !resume) {
    return { ok: false, reason: "not_found" };
  }

  const raw = resume.parsed_text;
  if (raw == null || !String(raw).trim()) {
    return { ok: true, text: null };
  }

  return { ok: true, text: String(raw).trim() };
}
