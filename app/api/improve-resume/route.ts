import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { chatCompletion } from "@/lib/openai";
import type { ImproveResumeResponse } from "@/types/analysis";

const SYSTEM_PROMPT = `You are an expert resume writer for software developers.
Rewrite the given resume bullet points to be:
- achievement focused
- measurable (include numbers, percentages, impact where possible)
- ATS optimized (relevant keywords)
- professional

Example transformation:
Before: Built a React app.
After: Developed a scalable React application improving performance by 30%.

Return ONLY valid JSON with this structure:
{ "improved_bullets": ["bullet1", "bullet2", ...] }

Each item in improved_bullets should be one rewritten bullet point. Keep the same number of bullets as in the input, or combine/split only if it improves clarity.`;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const resumeText = body?.resumeText ?? body?.resume_text;
  if (!resumeText || typeof resumeText !== "string") {
    return NextResponse.json(
      { error: "resumeText is required" },
      { status: 400 }
    );
  }

  const text = resumeText.slice(0, 12000);
  try {
    const raw = await chatCompletion(SYSTEM_PROMPT, text, { jsonMode: true });
    const result = JSON.parse(raw) as ImproveResumeResponse;
    if (!Array.isArray(result.improved_bullets)) {
      result.improved_bullets = [];
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("Improve resume error:", e);
    return NextResponse.json(
      { error: "Failed to improve resume" },
      { status: 500 }
    );
  }
}
