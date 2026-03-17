import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createShareableResult, getSharedResult } from "@/lib/shareableResults";

/** POST /api/share-result — Create a shareable result link */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = body as {
    type?: string;
    data?: Record<string, unknown>;
  };

  const validTypes = ["ats_score", "interview_probability", "hiring_benchmark"];
  if (!type || !validTypes.includes(type) || !data) {
    return NextResponse.json(
      { error: "type (ats_score|interview_probability|hiring_benchmark) and data required" },
      { status: 400 }
    );
  }

  try {
    const token = await createShareableResult(
      user.id,
      type as "ats_score" | "interview_probability" | "hiring_benchmark",
      data
    );
    return NextResponse.json({ token, url: `/results/${token}` });
  } catch (err) {
    console.error("Share result error:", err);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}

/** GET /api/share-result?token=xxx — Retrieve a shared result */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  try {
    const result = await getSharedResult(token);
    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("Get shared result error:", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
