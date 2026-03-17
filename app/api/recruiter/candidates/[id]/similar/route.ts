import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { findSimilarCandidates } from "@/lib/candidateGraph";
import { isValidUUID } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only recruiters can use this
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid candidate ID" }, { status: 400 });
  }

  try {
    const similar = await findSimilarCandidates(id, 10);
    return NextResponse.json(similar);
  } catch (err) {
    console.error("Similar candidates error:", err);
    return NextResponse.json({ error: "Failed to find similar candidates" }, { status: 500 });
  }
}
