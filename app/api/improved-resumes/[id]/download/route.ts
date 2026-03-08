import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildImprovedResumeDocx } from "@/lib/buildDocx";
import { isValidUUID } from "@/lib/validation";
import type { ImprovedResumeContent } from "@/types/analysis";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const format = new URL(request.url).searchParams.get("format") || "docx";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("improved_resumes")
    .select("improved_content")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const content = data.improved_content as ImprovedResumeContent;
  if (format === "docx") {
    const buffer = await buildImprovedResumeDocx(content);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="improved-resume-${id.slice(0, 8)}.docx"`,
      },
    });
  }
  return NextResponse.json({ error: "Unsupported format. Use format=docx" }, { status: 400 });
}
