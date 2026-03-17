import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getApplicationInsights, getConversionFunnel } from "@/lib/learningEngine";

/**
 * GET /api/insights
 * Returns learning insights + conversion funnel for current user.
 */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [insights, funnel] = await Promise.all([
      getApplicationInsights(user.id),
      getConversionFunnel(user.id),
    ]);

    return NextResponse.json({ insights, funnel });
  } catch (err) {
    console.error("Insights error:", err);
    return NextResponse.json({ error: "Failed to load insights" }, { status: 500 });
  }
}
