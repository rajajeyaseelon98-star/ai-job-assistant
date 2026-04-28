import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID, validateTextLength } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const { id } = await params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.interview_date !== "string" || !body.interview_date) {
    return NextResponse.json({ error: "interview_date is required" }, { status: 400 });
  }

  const interviewDate = new Date(body.interview_date);
  if (isNaN(interviewDate.getTime())) {
    return NextResponse.json({ error: "Invalid interview_date format" }, { status: 400 });
  }
  if (interviewDate <= new Date()) {
    return NextResponse.json({ error: "interview_date must be in the future" }, { status: 400 });
  }

  let interviewNotes: string | null = null;
  if (typeof body.interview_notes === "string" && body.interview_notes.trim()) {
    const notesVal = validateTextLength(body.interview_notes, 5000, "interview_notes");
    if (!notesVal.valid) return NextResponse.json({ error: notesVal.error }, { status: 400 });
    interviewNotes = notesVal.text;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_applications")
    .update({
      interview_date: interviewDate.toISOString(),
      interview_notes: interviewNotes,
      stage: "interview_scheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Application not found or update failed" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const { id } = await params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.interview_date === "string" && body.interview_date) {
    const interviewDate = new Date(body.interview_date);
    if (isNaN(interviewDate.getTime())) {
      return NextResponse.json({ error: "Invalid interview_date format" }, { status: 400 });
    }
    if (interviewDate <= new Date()) {
      return NextResponse.json({ error: "interview_date must be in the future" }, { status: 400 });
    }
    updates.interview_date = interviewDate.toISOString();
  }

  if (typeof body.interview_notes === "string") {
    // Allow empty string (clears notes) but enforce max length
    if (body.interview_notes.length > 5000) {
      return NextResponse.json({ error: "interview_notes exceeds maximum length of 5000 characters" }, { status: 400 });
    }
    updates.interview_notes = body.interview_notes.trim() || null;
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_applications")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Application not found or update failed" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_applications")
    .update({
      interview_date: null,
      interview_notes: null,
      stage: "shortlisted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Application not found or update failed" }, { status: 404 });
  }

  return NextResponse.json(data);
}
