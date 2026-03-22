import { NextResponse } from "next/server";
import { getUser, ensureUserRow } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromPdf } from "@/utils/pdfParser";
import { extractTextFromDocx } from "@/utils/docxParser";

/** GET /api/upload-resume — list user's uploaded resumes */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("id, file_url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load resumes" }, { status: 500 });
  }

  // Derive a file_name from the file_url for display
  const resumes = (data || []).map((r) => {
    const urlPath = r.file_url?.split("/").pop() || "";
    const fileName = urlPath.replace(/^\d+-/, "").replace(/_/g, " ") || "Resume";
    return { id: r.id, file_name: fileName, file_url: r.file_url, created_at: r.created_at };
  });

  return NextResponse.json(resumes);
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Magic bytes for file type validation
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF
const DOCX_MAGIC = [0x50, 0x4b, 0x03, 0x04]; // PK.. (ZIP/DOCX)

function validateFileHeader(buffer: Buffer, type: string): boolean {
  if (buffer.length < 4) return false;
  const header = Array.from(buffer.subarray(0, 4));
  if (type === "application/pdf") {
    return PDF_MAGIC.every((b, i) => header[i] === b);
  }
  // DOCX is a ZIP file
  return DOCX_MAGIC.every((b, i) => header[i] === b);
}

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

  // Validate file header (magic bytes) to prevent disguised files
  if (!validateFileHeader(buffer, file.type)) {
    return NextResponse.json(
      { error: "File content does not match its type. Upload a valid PDF or DOCX." },
      { status: 400 }
    );
  }

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
      {
        error:
          "We couldn’t read text from this file. Try a DOCX export, a different PDF, or copy-paste your resume text instead.",
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
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

  // Store the storage path (not a signed URL) so it never expires.
  // Generate signed URLs on-demand at read time via /api/resume-file/[id].
  const storagePath = uploadData.path;

  const { data: row, error: insertError } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      file_url: storagePath,
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
