import { NextResponse, type NextRequest } from "next/server";
import { getUser, ensureUserRow } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { isValidUUID } from "@/lib/validation";
import { companyLogoStoragePathFromPublicUrl } from "@/lib/company-logo-storage";
import {
  ALLOWED_IMAGE_MIME,
  IMAGE_UPLOAD_MAX_BYTES,
  extensionForImageMime,
  validateImageMagicBytes,
} from "@/lib/image-upload-validate";

/** POST multipart `file` — uploads to `company-logos/{recruiterId}/…`, sets `companies.logo_url`. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: companyId } = await params;
  if (!isValidUUID(companyId)) {
    return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  await ensureUserRow(user.id, user.email);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED_IMAGE_MIME.has(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
  }
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 2MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!validateImageMagicBytes(buffer, file.type)) {
    return NextResponse.json(
      { error: "File content does not match its declared type" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: company, error: findErr } = await supabase
    .from("companies")
    .select("id, logo_url")
    .eq("id", companyId)
    .eq("recruiter_id", user.id)
    .single();

  if (findErr || !company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const oldPath = companyLogoStoragePathFromPublicUrl(company.logo_url);
  if (oldPath) {
    await supabase.storage.from("company-logos").remove([oldPath]);
  }

  const path = `${user.id}/company-${companyId}-${Date.now()}.${extensionForImageMime(file.type)}`;
  const { error: uploadError } = await supabase.storage.from("company-logos").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    console.error("company logo upload:", uploadError);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("company-logos").getPublicUrl(path);

  const { data: updated, error: updErr } = await supabase
    .from("companies")
    .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", companyId)
    .eq("recruiter_id", user.id)
    .select()
    .single();

  if (updErr || !updated) {
    return NextResponse.json({ error: "Failed to save logo" }, { status: 500 });
  }

  return NextResponse.json({ logo_url: publicUrl, company: updated });
}

/** DELETE — clear logo_url and remove storage object when URL points at our bucket. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: companyId } = await params;
  if (!isValidUUID(companyId)) {
    return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: company, error: findErr } = await supabase
    .from("companies")
    .select("id, logo_url")
    .eq("id", companyId)
    .eq("recruiter_id", user.id)
    .single();

  if (findErr || !company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const oldPath = companyLogoStoragePathFromPublicUrl(company.logo_url);
  if (oldPath) {
    await supabase.storage.from("company-logos").remove([oldPath]);
  }

  const { data: updated, error: updErr } = await supabase
    .from("companies")
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq("id", companyId)
    .eq("recruiter_id", user.id)
    .select()
    .single();

  if (updErr || !updated) {
    return NextResponse.json({ error: "Failed to remove logo" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, logo_url: null, company: updated });
}
