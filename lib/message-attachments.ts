import type { SupabaseClient } from "@supabase/supabase-js";

export const MESSAGE_ATTACHMENTS_BUCKET = "message-attachments";

/** Matches `supabase/migrations/20260407120000_messages_read_at_attachments_search_rank.sql` */
export const MESSAGE_ATTACHMENT_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
]);

export const MESSAGE_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

const SIGNED_URL_TTL_SEC = 3600;

export function isAttachmentPathOwnedBySender(
  path: string | null | undefined,
  senderId: string
): boolean {
  if (!path?.trim()) return false;
  const first = path.split("/").filter(Boolean)[0];
  return first === senderId;
}

export function safeAttachmentFileName(name: string): string {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "file";
  const cleaned = base.replace(/[^\w.\-]+/g, "_").slice(0, 180);
  return cleaned || "file";
}

export async function messagesWithSignedAttachmentUrls<
  T extends { attachment_path?: string | null },
>(supabase: SupabaseClient, messages: T[]): Promise<(T & { attachment_url: string | null })[]> {
  return Promise.all(
    messages.map(async (m) => {
      const path = m.attachment_path;
      if (!path) return { ...m, attachment_url: null };
      const { data, error } = await supabase.storage
        .from(MESSAGE_ATTACHMENTS_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SEC);
      if (error || !data?.signedUrl) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[message-attachments] createSignedUrl:", error?.message);
        }
        return { ...m, attachment_url: null };
      }
      return { ...m, attachment_url: data.signedUrl };
    })
  );
}
