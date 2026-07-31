// Handles the email-confirmation redirect from Supabase.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/next";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  // Confirming your email lands you back on the page that sent you to sign up
  // (the agency application, a booking, verification…), not on the homepage.
  const next = safeNext(searchParams.get("next"));
  return NextResponse.redirect(origin + (next ?? "/"));
}
