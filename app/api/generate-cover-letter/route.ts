import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { canUseFeature, logUsage } from "@/lib/usage";
import { chatCompletion } from "@/lib/openai";

const SYSTEM_PROMPT = `You are an expert cover letter writer for software developers.
Write a professional cover letter based on the resume and job details.
Tone: professional, concise, enthusiastic.
Do not use placeholders like [Company] or [Role] - use the actual company name and role provided.
Return only the cover letter text, no JSON. Start with "Dear Hiring Manager," or similar.`;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planType = user.profile?.plan_type ?? "free";
  const { allowed } = await canUseFeature(user.id, "cover_letter", planType);
  if (!allowed) {
    return NextResponse.json(
      { error: "Free limit reached for cover letters. Upgrade to Pro for unlimited." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { resumeText, jobDescription, companyName, role } = body as {
    resumeText?: string;
    jobDescription?: string;
    companyName?: string;
    role?: string;
  };
  if (!resumeText || !jobDescription) {
    return NextResponse.json(
      { error: "resumeText and jobDescription are required" },
      { status: 400 }
    );
  }

  const content = `Company: ${companyName || "Company"}\nRole: ${role || "Software Developer"}\n\nJob description:\n${jobDescription.slice(0, 4000)}\n\nResume:\n${resumeText.slice(0, 6000)}`;
  try {
    const letter = await chatCompletion(SYSTEM_PROMPT, content);
    await logUsage(user.id, "cover_letter");
    return NextResponse.json({ coverLetter: letter });
  } catch (e) {
    console.error("Cover letter error:", e);
    return NextResponse.json(
      { error: "Failed to generate cover letter" },
      { status: 500 }
    );
  }
}
