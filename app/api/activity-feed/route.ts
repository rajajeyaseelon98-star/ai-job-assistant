import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getUserActivityFeed, getPublicActivityFeed } from "@/lib/activityFeed";

/** GET /api/activity-feed — Get user's activity feed or public feed */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isPublic = searchParams.get("public") === "true";

  if (isPublic) {
    const feed = await getPublicActivityFeed(20);
    return NextResponse.json(feed);
  }

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");
  const feed = await getUserActivityFeed(user.id, limit, offset);

  return NextResponse.json(feed);
}
