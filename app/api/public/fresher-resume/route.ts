import { NextRequest, NextResponse } from "next/server";
import { cachedAiGenerate } from "@/lib/ai";
import { validateTextLength } from "@/lib/validation";

const SYSTEM = `You are an expert resume writer for the India job market. ATS-friendly, clear sections, no fabrication.

The candidate is a fresher. Build a professional resume from their answers only.

Return ONLY valid JSON (no markdown fences):
{
  "resumeText": "string — full resume as plain text with sections like CONTACT, SUMMARY, SKILLS, EDUCATION, PROJECTS (use placeholders for phone/email if missing: e.g. Phone: +91-XXXXXXXXXX)",
  "atsScore": number
}

Rules:
- atsScore: integer 0-100 based on structure, keywords for their target role, and clarity.
- resumeText: 400-1800 words max, scannable, action verbs where appropriate.`;

/**
 * Public: generate a fresher resume draft + indicative ATS score (landing → signup).
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const desiredRole = validateTextLength(String(o.desiredRole ?? ""), 200, "Desired role");
  const education = validateTextLength(String(o.education ?? ""), 2000, "Education");
  const skills = validateTextLength(String(o.skills ?? ""), 2000, "Skills");
  const projectsRaw = String(o.projects ?? "").trim();
  const projects =
    projectsRaw.length === 0
      ? ({ valid: true as const, text: "" } as const)
      : validateTextLength(projectsRaw, 3000, "Projects");

  if (!desiredRole.valid) {
    return NextResponse.json({ error: desiredRole.error ?? "Desired role required" }, { status: 400 });
  }
  if (!education.valid) {
    return NextResponse.json({ error: education.error ?? "Education required" }, { status: 400 });
  }
  if (!skills.valid) {
    return NextResponse.json({ error: skills.error ?? "Skills required" }, { status: 400 });
  }
  if (!projects.valid) {
    return NextResponse.json({ error: projects.error }, { status: 400 });
  }

  const userContent = `Desired job role: ${desiredRole.text}
Education: ${education.text}
Skills: ${skills.text}
Projects / internships (optional): ${projects.text || "None provided"}`;

  try {
    const raw = await cachedAiGenerate(SYSTEM, userContent, {
      jsonMode: true,
      cacheFeature: "fresher_resume_public",
      featureName: "fresher_resume_public",
    });

    let parsed: { resumeText?: string; atsScore?: number };
    try {
      parsed = JSON.parse(raw) as { resumeText?: string; atsScore?: number };
    } catch {
      return NextResponse.json({ error: "Could not generate resume. Try again." }, { status: 502 });
    }

    const resumeText = typeof parsed.resumeText === "string" ? parsed.resumeText.trim() : "";
    let atsScore = Number(parsed.atsScore);
    if (!Number.isFinite(atsScore)) atsScore = 72;
    atsScore = Math.min(100, Math.max(0, Math.round(atsScore)));

    if (resumeText.length < 50) {
      return NextResponse.json({ error: "Could not generate resume. Try again." }, { status: 502 });
    }

    return NextResponse.json({
      resumeText: resumeText.slice(0, 50_000),
      atsScore,
    });
  } catch (e) {
    console.error("fresher-resume:", e);
    return NextResponse.json({ error: "Generation failed. Try again in a moment." }, { status: 503 });
  }
}
