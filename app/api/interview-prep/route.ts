import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { canUseFeature, logUsage } from "@/lib/usage";
import { aiGenerate } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rateLimit";
import type { InterviewPrepResponse } from "@/types/analysis";

const SYSTEM_PROMPT = `You are an expert technical interviewer for software developers.
Given a job role and experience level, generate:
1. 10 technical interview questions (with brief answers)
2. 5 behavioral questions (with brief answer guidelines)
3. 5 coding questions (e.g. "Implement debounce", "Reverse a linked list") with brief solution notes

Return ONLY valid JSON:
{
  "technical_questions": [{"question": "...", "answer": "..."}],
  "behavioral_questions": [{"question": "...", "answer": "..."}],
  "coding_questions": [{"question": "...", "answer": "..."}]
}`;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = checkRateLimit(user.id);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });

  const planType = user.profile?.plan_type ?? "free";
  const { allowed } = await canUseFeature(user.id, "interview_prep", planType);
  if (!allowed && (planType === "free")) {
    return NextResponse.json(
      { error: "Interview prep is available on Pro or Premium plan only." },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const role = (body?.role ?? body?.jobRole ?? "Software Developer") as string;
  const experienceLevel = (body?.experienceLevel ?? body?.experience_level ?? "") as string;
  if (!role || typeof role !== "string") {
    return NextResponse.json(
      { error: "role is required" },
      { status: 400 }
    );
  }

  const userContent = `Job role: ${role.slice(0, 200)}${experienceLevel ? `\nExperience level: ${String(experienceLevel).slice(0, 50)}` : ""}`;
  try {
    const raw = await aiGenerate(SYSTEM_PROMPT, userContent, { jsonMode: true });
    let jsonStr = raw.trim();
    const jsonMatch = jsonStr.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    const result = JSON.parse(jsonStr) as InterviewPrepResponse;
    if (!Array.isArray(result.technical_questions)) result.technical_questions = [];
    if (!Array.isArray(result.behavioral_questions)) result.behavioral_questions = [];
    if (!Array.isArray(result.coding_questions)) result.coding_questions = [];
    await logUsage(user.id, "interview_prep");

    const supabase = await createClient();
    await supabase.from("interview_sessions").insert({
      user_id: user.id,
      role: role.slice(0, 200),
      experience_level: experienceLevel?.slice(0, 50) || null,
      content_json: result,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("Interview prep error:", e);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
