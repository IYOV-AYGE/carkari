/**
 * Health probe for uptime monitoring (BetterStack, UptimeRobot, Pingdom…).
 *
 * Point the monitor here rather than at the homepage: the homepage can render
 * from cache while the database is down, so it would report "up" during an
 * outage that stops every booking. This actually touches Postgres.
 *
 * 200 = healthy, 503 = degraded. No authentication, but it leaks nothing:
 * only a count of publicly-listed vehicles and a latency figure.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const started = Date.now();
  const checks: Record<string, "ok" | "fail"> = {};
  let status = 200;

  const env =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  checks.env = env ? "ok" : "fail";
  if (!env) status = 503;

  let vehicles: number | null = null;
  if (env) {
    try {
      const supabase = await createClient();
      const { count, error } = await supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("status", "live");
      if (error) throw error;
      vehicles = count ?? 0;
      checks.database = "ok";
    } catch {
      checks.database = "fail";
      status = 503;
    }
  }

  return NextResponse.json(
    {
      status: status === 200 ? "healthy" : "degraded",
      checks,
      live_vehicles: vehicles,
      latency_ms: Date.now() - started,
      region: process.env.VERCEL_REGION ?? "local",
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      at: new Date().toISOString(),
    },
    { status, headers: { "cache-control": "no-store" } }
  );
}
