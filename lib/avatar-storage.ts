/** Extract `userId/filename` path within the `avatars` bucket from a public object URL. */
export function avatarStoragePathFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = "/object/public/avatars/";
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return url.slice(i + marker.length).split("?")[0] ?? null;
}
