import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("recruiter_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load companies" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

const VALID_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, description, website, logo_url, industry, size, location, culture, benefits } =
    body as {
      name?: string;
      description?: string;
      website?: string;
      logo_url?: string;
      industry?: string;
      size?: string;
      location?: string;
      culture?: string;
      benefits?: string;
    };

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .insert({
      recruiter_id: user.id,
      name: name.trim().slice(0, 200),
      description: description?.trim().slice(0, 5000) || null,
      website: website?.trim().slice(0, 500) || null,
      logo_url: logo_url?.trim().slice(0, 500) || null,
      industry: industry?.trim().slice(0, 200) || null,
      size: typeof size === "string" && VALID_SIZES.includes(size) ? size : null,
      location: location?.trim().slice(0, 200) || null,
      culture: culture?.trim().slice(0, 5000) || null,
      benefits: benefits?.trim().slice(0, 5000) || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert company error:", error);
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
