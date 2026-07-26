// Manual language switch: /lang/en or /lang/fr — sets cookie, returns to page.
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const lang = code === "en" ? "en" : "fr";
  const back = request.headers.get("referer") ?? new URL("/", request.url).toString();
  const res = NextResponse.redirect(back);
  res.cookies.set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
