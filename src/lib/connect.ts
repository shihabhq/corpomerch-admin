/**
 * Corpomerch Connect link rules. Mirrored (not imported) by corpomerch-connect,
 * which owns the route table — keep RESERVED_SLUGS in sync with it.
 */

/** Top-level paths the Connect app already serves, so a card can never shadow them. */
export const RESERVED_SLUGS = new Set([
  "login",
  "logout",
  "auth",
  "api",
  "demo",
  "admin",
  "account",
  "register",
  "signup",
  "shop",
  "help",
  "support",
  "terms",
  "privacy",
  "robots",
  "sitemap",
  "favicon",
  "static",
  "assets",
  "public",
]);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function connectUrl(slug: string): string {
  const base = (process.env.CONNECT_APP_URL ?? "https://connect.corpomerch.com").replace(/\/+$/, "");
  return `${base}/${slug}`;
}
