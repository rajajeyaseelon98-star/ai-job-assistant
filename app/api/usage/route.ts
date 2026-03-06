import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getUsageSummary } from "@/lib/usage";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const planType = user.profile?.plan_type ?? "free";
  const summary = await getUsageSummary(user.id, planType);
  return NextResponse.json(summary);
}
