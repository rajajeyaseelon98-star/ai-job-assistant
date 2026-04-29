import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { isE2eMockUserId } from "@/lib/e2e-auth";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { role } = body as { role?: string };
  if (role !== "job_seeker" && role !== "recruiter") {
    return NextResponse.json({ error: "role must be job_seeker or recruiter" }, { status: 400 });
  }

  if (isE2eMockUserId(user.id)) {
    return NextResponse.json({ role });
  }

  const service = createServiceRoleClient();
  const supabase = service ?? (await createClient());
  const { data, error } = await supabase
    .from("users")
    .update({ role, last_active_role: role })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: "Failed to update role",
        detail: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: "No profile row found. Try signing out and back in." },
      { status: 404 }
    );
  }

  return NextResponse.json({ role });
}
