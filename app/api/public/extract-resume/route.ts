import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdf } from "@/utils/pdfParser";
import { extractTextFromDocx } from "@/utils/docxParser";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Public, unauthenticated: extract plain text from PDF/DOCX/TXT for landing-page flow.
 * Stored client-side in sessionStorage then user signs up → resume analyzer.
 */
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 4MB)" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  let text = "";

  try {
    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      text = await extractTextFromPdf(buf);
    } else if (name.endsWith(".docx") || file.type.includes("wordprocessingml")) {
      text = await extractTextFromDocx(buf);
    } else if (name.endsWith(".txt") || file.type === "text/plain") {
      text = buf.toString("utf-8");
    } else {
      return NextResponse.json({ error: "Use PDF, DOCX, or TXT" }, { status: 400 });
    }
  } catch (e) {
    console.error("extract-resume:", e);
    return NextResponse.json(
      { error: "Could not read this file. Try another format or paste your resume text." },
      { status: 422 }
    );
  }

  const trimmed = text.trim();
  if (trimmed.length < 20) {
    return NextResponse.json(
      { error: "Could not extract enough text. Try pasting your resume text instead." },
      { status: 422 }
    );
  }

  return NextResponse.json({ text: trimmed.slice(0, 50_000) });
}
