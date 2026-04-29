/** Shared validation for JPEG/PNG/WebP uploads (avatars, company logos). */

export const IMAGE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47];

function looksLikeWebp(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  return (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  );
}

export function validateImageMagicBytes(buffer: Buffer, mime: string): boolean {
  if (buffer.length < 4) return false;
  if (mime === "image/jpeg") return JPEG.every((b, i) => buffer[i] === b);
  if (mime === "image/png") return PNG.every((b, i) => buffer[i] === b);
  if (mime === "image/webp") return looksLikeWebp(buffer);
  return false;
}

export function extensionForImageMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "webp";
}
