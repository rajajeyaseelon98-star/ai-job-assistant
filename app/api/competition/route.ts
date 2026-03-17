import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getOverallCompetition } from "@/lib/candidateCompetition";

/** GET /api/competition — Your overall competitive position */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const competition = await getOverallCompetition(user.id);
    return NextResponse.json(competition);
  } catch (err) {
    console.error("Competition error:", err);
    return NextResponse.json({ error: "Failed to load competition data" }, { status: 500 });
  }
}
