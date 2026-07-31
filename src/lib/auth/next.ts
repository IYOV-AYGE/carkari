/**
 * Sanitises a post-login return path.
 *
 * Only same-site absolute paths are allowed. Anything else (a full URL, a
 * protocol-relative "//evil.com", a backslash trick) is dropped, which closes
 * the open-redirect hole that a naive `?next=` parameter would open: an
 * attacker could otherwise mail "carkari.com/auth?next=https://evil.com" and
 * have us bounce a freshly authenticated user onto their phishing page.
 */
export function safeNext(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v.startsWith("/")) return null; // must be relative to our own origin
  if (v.startsWith("//") || v.startsWith("/\\")) return null; // protocol-relative
  if (v.includes("\\")) return null;
  if (v.startsWith("/auth")) return null; // never bounce back into the auth page
  return v;
}

/** Builds `/auth?...` with an optional mode and return path. */
export function authHref(
  next?: string | null,
  mode?: "login" | "signup"
): string {
  const params = new URLSearchParams();
  if (mode) params.set("mode", mode);
  const n = safeNext(next);
  if (n) params.set("next", n);
  const qs = params.toString();
  return qs ? `/auth?${qs}` : "/auth";
}
