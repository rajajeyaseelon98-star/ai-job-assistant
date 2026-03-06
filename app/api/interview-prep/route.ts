import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { canUseFeature, logUsage } from "@/lib/usage";
import { chatCompletion } from "@/lib/openai";
import type { InterviewPrepResponse } from "@/types/analysis";

const SYSTEM_PROMPT = `You are an expert technical interviewer for software developers.
Given a job role, generate:
1. 10 technical interview questions relevant to that role (with brief answers)
2. 5 behavioral questions (with brief answer guidelines)

Return ONLY valid JSON:
{
  "technical_questions": [{"question": "...", "answer": "..."}],
  "behavioral_questions": [{"question": "...", "answer": "..."}]
}`;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planType = user.profile?.plan_type ?? "pro";
  const { allowed } = await canUseFeature(user.id, "interview_prep", planType);
  if (!allowed && planType === "free") {
    return NextResponse.json(
      { error: "Interview prep is available on Pro plan only." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const role = body?.role ?? body?.jobRole ?? "Software Developer";
  if (!role || typeof role !== "string") {
    return NextResponse.json(
      { error: "role is required" },
      { status: 400 }
    );
  }

  try {
    const raw = await chatCompletion(
      SYSTEM_PROMPT,
      `Job role: ${role.slice(0, 200)}`,
      { jsonMode: true }
    );
    const result = JSON.parse(raw) as InterviewPrepResponse;
    if (!Array.isArray(result.technical_questions)) result.technical_questions = [];
    if (!Array.isArray(result.behavioral_questions)) result.behavioral_questions = [];
    await logUsage(user.id, "interview_prep");
    return NextResponse.json(result);
  } catch (e) {
    console.error("Interview prep error:", e);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
