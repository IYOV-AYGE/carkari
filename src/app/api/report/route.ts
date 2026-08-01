/**
 * Receives client-side crash reports from global-error.tsx.
 *
 * Public by necessity (a crashed page may have no session), so it is written
 * defensively: payload size is capped, fields are truncated, and it always
 * answers 204 so a bot learns nothing from probing it.
 */
import { NextResponse } from "next/server";
import { reportError } from "@/lib/observability/report";

export const dynamic = "force-dynamic";

const MAX_BODY = 8_000;
const cut = (v: unknown, n: number) =>
  typeof v === "string" ? v.slice(0, n) : undefined;

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return new NextResponse(null, { status: 204 });

    const b = JSON.parse(raw) as Record<string, unknown>;
    const err = new Error(cut(b.message, 500) ?? "client error");
    err.name = cut(b.name, 100) ?? "ClientError";
    err.stack = cut(b.stack, 4000);

    await reportError(err, {
      side: "client",
      url: cut(b.url, 500),
      digest: cut(b.digest, 100),
      ua: cut(request.headers.get("user-agent"), 300),
    });
  } catch {
    /* malformed report — ignore */
  }
  return new NextResponse(null, { status: 204 });
}
