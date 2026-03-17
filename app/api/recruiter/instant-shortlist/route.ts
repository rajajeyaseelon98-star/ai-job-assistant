import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getInstantShortlist } from "@/lib/instantShortlist";

/**
 * POST /api/recruiter/instant-shortlist
 * Body: { job_title, skills_required[], experience_min?, experience_max?, location? }
 * Returns: Instant top matching candidates
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { job_title, skills_required, experience_min, experience_max, location, limit } = body as {
    job_title?: string;
    skills_required?: string[];
    experience_min?: number;
    experience_max?: number;
    location?: string;
    limit?: number;
  };

  if (!job_title || !Array.isArray(skills_required) || skills_required.length === 0) {
    return NextResponse.json(
      { error: "job_title and skills_required[] are required" },
      { status: 400 }
    );
  }

  const result = await getInstantShortlist(
    job_title,
    skills_required,
    experience_min,
    experience_max,
    location,
    Math.min(limit || 10, 20)
  );

  return NextResponse.json(result);
}
