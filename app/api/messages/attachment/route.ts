import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getUser, ensureUserRow } from "@/lib/auth";
import { isE2eMockUserId } from "@/lib/e2e-auth";
import {
  MESSAGE_ATTACHMENTS_BUCKET,
  MESSAGE_ATTACHMENT_ALLOWED_MIME,
  MESSAGE_ATTACHMENT_MAX_BYTES,
  safeAttachmentFileName,
} from "@/lib/message-attachments";
import { createClient } from "@/lib/supabase/server";

/** POST multipart field `file` — uploads to message-attachments/{userId}/… for use with POST /api/messages. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!MESSAGE_ATTACHMENT_ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed (images, PDF, or plain text)" },
      { status: 400 }
    );
  }
  if (file.size > MESSAGE_ATTACHMENT_MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const safeName = safeAttachmentFileName(file.name);
  const storagePath = `${user.id}/${randomUUID()}-${safeName}`;

  if (isE2eMockUserId(user.id)) {
    return NextResponse.json({
      attachment_path: storagePath,
      attachment_name: file.name.slice(0, 240),
      attachment_mime: file.type,
    });
  }

  await ensureUserRow(user.id, user.email);

  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage
    .from(MESSAGE_ATTACHMENTS_BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (upErr) {
    console.error("message attachment upload:", upErr);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  return NextResponse.json({
    attachment_path: storagePath,
    attachment_name: file.name.slice(0, 240),
    attachment_mime: file.type,
  });
}
