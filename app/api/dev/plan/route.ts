import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type PlanType = "free" | "pro" | "premium";

/**
 * Dev-only: set current user's plan_type for local testing.
 * Only works when NODE_ENV === "development".
 */
export async function PATCH(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const planType = body?.planType as PlanType | undefined;
  if (!planType || !["free", "pro", "premium"].includes(planType)) {
    return NextResponse.json(
      { error: "planType required: free | pro | premium" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ plan_type: planType })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, planType });
}
