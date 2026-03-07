import { NextResponse } from "next/server";
import { getUser, ensureUserRow } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromPdf } from "@/utils/pdfParser";
import { extractTextFromDocx } from "@/utils/docxParser";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureUserRow(user.id, user.email);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PDF and DOCX files are allowed" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 5MB)" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let parsedText: string;

  try {
    if (file.type === "application/pdf") {
      parsedText = await extractTextFromPdf(buffer);
    } else {
      parsedText = await extractTextFromDocx(buffer);
    }
  } catch (e) {
    console.error("Parse error:", e);
    return NextResponse.json(
      { error: "Failed to extract text from file" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "pdf";
  const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Upload failed: " + uploadError.message },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(uploadData.path);
  const fileUrl = urlData.publicUrl;

  const { data: row, error: insertError } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      file_url: fileUrl,
      parsed_text: parsedText || null,
    })
    .select("id, file_url, parsed_text, created_at")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to save record: " + insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: row.id,
    file_url: row.file_url,
    parsed_text: row.parsed_text,
    created_at: row.created_at,
  });
}
