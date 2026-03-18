import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateTextLength } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const unread = url.searchParams.get("unread");

  const supabase = await createClient();
  let query = supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (unread === "true") {
    query = query.eq("receiver_id", user.id).eq("is_read", false);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { receiver_id, job_id, subject, content, template_name } = body as {
    receiver_id?: string;
    job_id?: string;
    subject?: string;
    content?: string;
    template_name?: string;
  };

  if (!receiver_id) {
    return NextResponse.json({ error: "receiver_id is required" }, { status: 400 });
  }

  // Validate text input sizes
  const contentVal = validateTextLength(content, 5000, "content");
  if (!contentVal.valid) return NextResponse.json({ error: contentVal.error }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id,
      job_id: job_id || null,
      subject: subject?.trim().slice(0, 200) || null,
      content: contentVal.text.slice(0, 5000),
      template_name: template_name?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
