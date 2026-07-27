// Browser client — use in "use client" components only.
import { createBrowserClient } from "@supabase/ssr";

function envOrEmpty(v?: string) {
  const clean = (v ?? "").trim();
  return /\s/.test(clean) ? "" : clean;
}

export function createClient() {
  return createBrowserClient(
    envOrEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL),
    envOrEmpty(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
