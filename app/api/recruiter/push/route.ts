import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { sendRecruiterPush } from "@/lib/recruiterPush";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateTextLength } from "@/lib/validation";

/** POST /api/recruiter/push — Send a push notification to a candidate */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { candidate_id, push_type, title, message, job_id } = body as {
    candidate_id?: string;
    push_type?: string;
    title?: string;
    message?: string;
    job_id?: string;
  };

  if (!candidate_id || !push_type || !title || !message) {
    return NextResponse.json(
      { error: "candidate_id, push_type, title, and message are required" },
      { status: 400 }
    );
  }

  // Validate text input sizes
  const titleVal = validateTextLength(title, 500, "title");
  if (!titleVal.valid) return NextResponse.json({ error: titleVal.error }, { status: 400 });
  const messageVal = validateTextLength(message, 5000, "message");
  if (!messageVal.valid) return NextResponse.json({ error: messageVal.error }, { status: 400 });

  const validTypes = ["job_invite", "interview_request", "profile_view", "shortlisted"];
  if (!validTypes.includes(push_type)) {
    return NextResponse.json(
      { error: `push_type must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  const result = await sendRecruiterPush(
    user.id,
    candidate_id,
    push_type as "job_invite" | "interview_request" | "profile_view" | "shortlisted",
    titleVal.text,
    messageVal.text,
    job_id
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 429 });
  }

  return NextResponse.json({ success: true });
}
