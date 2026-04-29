/** Extract path within the `company-logos` bucket from a public object URL. */
export function companyLogoStoragePathFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = "/object/public/company-logos/";
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return url.slice(i + marker.length).split("?")[0] ?? null;
}
