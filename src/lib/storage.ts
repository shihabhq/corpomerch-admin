const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://hdmonhqhsaomwskzktdm.supabase.co";

export interface ImageSource {
  storagePath?: string | null;
  externalUrl?: string | null;
}

/**
 * Build a public URL from a stored path. Always go through here so the bucket
 * host can change without a data migration.
 */
export function imageUrl(
  source: ImageSource | null | undefined,
  bucket = "product-images",
): string | null {
  if (!source) return null;
  if (source.externalUrl) {
    // Seed fallback paths point at the storefront's /public folder.
    return source.externalUrl.startsWith("/")
      ? `${process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000"}${source.externalUrl}`
      : source.externalUrl;
  }
  if (source.storagePath) {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${source.storagePath}`;
  }
  return null;
}
