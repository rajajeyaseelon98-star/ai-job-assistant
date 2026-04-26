import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getAiUsageFeatureBreakdown } from "@/lib/aiUsageQueries";

export async function GET() {
  const requestId = crypto.randomUUID();
  const generatedAt = new Date().toISOString();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized", requestId, retryable: false }, { status: 401 });

  try {
    const rows = await getAiUsageFeatureBreakdown(user.id);
    return NextResponse.json({ rows, meta: { generatedAt, requestId } });
  } catch (e) {
    const detail = e instanceof Error ? e.message : "Unknown usage breakdown error";
    console.error("[usage-feature-breakdown] failed:", detail);
    return NextResponse.json(
      {
        error: "Failed to load usage feature breakdown",
        detail,
        requestId,
        retryable: true,
        nextAction: "Retry usage refresh",
      },
      { status: 500 }
    );
  }
}

