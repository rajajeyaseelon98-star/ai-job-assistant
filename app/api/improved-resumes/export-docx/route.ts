import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { buildImprovedResumeDocx } from "@/lib/buildDocx";
import type { ImprovedResumeContent } from "@/types/analysis";

/**
 * POST: build and download DOCX from improved resume content (no saved row needed).
 * Use when the client has content but no improvedResumeId (e.g. right after improve).
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { content?: ImprovedResumeContent };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const content = body?.content;
  if (!content || typeof content !== "object") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const buffer = await buildImprovedResumeDocx(content as ImprovedResumeContent);
  const filename = "improved-resume.docx";
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
