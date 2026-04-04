import { NextResponse } from "next/server";
import { getUser, ensureUserRow } from "@/lib/auth";
import { isE2eMockUserId } from "@/lib/e2e-auth";
import { createClient } from "@/lib/supabase/server";
import { recalculateProfileStrengthForUser } from "@/lib/recalculate-profile-strength";
import { avatarStoragePathFromPublicUrl } from "@/lib/avatar-storage";
import {
  ALLOWED_IMAGE_MIME,
  IMAGE_UPLOAD_MAX_BYTES,
  extensionForImageMime,
  validateImageMagicBytes,
} from "@/lib/image-upload-validate";

/** POST multipart field `file` — uploads to `avatars/{userId}/…`, sets users.avatar_url, recomputes profile_strength. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isE2eMockUserId(user.id)) {
    return NextResponse.json({
      avatar_url: "https://example.test/e2e-avatar.png",
      profile_strength: 72,
    });
  }

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

  const { data: row } = await supabase.from("users").select("avatar_url").eq("id", user.id).single();
  const oldPath = avatarStoragePathFromPublicUrl(row?.avatar_url ?? null);
  if (oldPath) {
    await supabase.storage.from("avatars").remove([oldPath]);
  }

  const path = `${user.id}/${Date.now()}.${extensionForImageMime(file.type)}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (uploadError) {
    console.error("avatar upload:", uploadError);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: updErr } = await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", user.id);
  if (updErr) {
    return NextResponse.json({ error: "Failed to save avatar" }, { status: 500 });
  }

  const profile_strength = await recalculateProfileStrengthForUser(supabase, user.id);

  return NextResponse.json({ avatar_url: publicUrl, profile_strength });
}

/** DELETE — clear avatar_url and remove object from storage when URL points at our bucket. */
export async function DELETE() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isE2eMockUserId(user.id)) {
    return NextResponse.json({ ok: true, profile_strength: 0 });
  }

  const supabase = await createClient();
  const { data: row } = await supabase.from("users").select("avatar_url").eq("id", user.id).single();
  const oldPath = avatarStoragePathFromPublicUrl(row?.avatar_url ?? null);
  if (oldPath) {
    await supabase.storage.from("avatars").remove([oldPath]);
  }

  const { error } = await supabase.from("users").update({ avatar_url: null }).eq("id", user.id);
  if (error) return NextResponse.json({ error: "Failed to remove avatar" }, { status: 500 });

  const profile_strength = await recalculateProfileStrengthForUser(supabase, user.id);

  return NextResponse.json({ ok: true, avatar_url: null, profile_strength });
}
