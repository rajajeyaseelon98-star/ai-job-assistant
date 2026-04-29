import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getAiUsageSummary } from "@/lib/aiUsageQueries";

export async function GET() {
  const requestId = crypto.randomUUID();
  const generatedAt = new Date().toISOString();
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", requestId, retryable: false }, { status: 401 });
  }

  try {
    const summary = await getAiUsageSummary(user.id);
    return NextResponse.json({
      ...summary,
      meta: {
        generatedAt,
        requestId,
      },
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : "Unknown usage summary error";
    console.error("[usage-summary] failed:", detail);
    return NextResponse.json(
      {
        error: "Failed to load usage summary",
        detail,
        requestId,
        retryable: true,
        nextAction: "Retry usage refresh",
      },
      { status: 500 }
    );
  }
}

