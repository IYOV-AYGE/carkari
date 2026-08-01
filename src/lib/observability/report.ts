/**
 * Error reporting with no SDK and no dependencies.
 *
 * Sends events straight to Sentry's HTTP ingest API, and optionally mirrors a
 * one-line summary to a Slack/Discord webhook so a human sees it immediately.
 *
 * Why not @sentry/nextjs: the SDK is heavier, wraps the build, and pulls in a
 * large dependency tree. This covers the case that actually matters — "an
 * error happened in production and nobody knows" — in ~80 lines. Swap in the
 * full SDK later if we want tracing and session replay; nothing here blocks it.
 *
 * Config (all optional — with none set, this is a no-op and never throws):
 *   SENTRY_DSN             server-side DSN
 *   NEXT_PUBLIC_SENTRY_DSN client-side DSN (same project is fine)
 *   ALERT_WEBHOOK_URL      Slack or Discord incoming webhook
 */

type Ctx = Record<string, string | number | boolean | null | undefined>;

/** https://<publicKey>@<host>/<projectId> */
function parseDsn(dsn: string) {
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\//, "");
    if (!u.username || !projectId) return null;
    return {
      url: `${u.protocol}//${u.host}/api/${projectId}/store/`,
      key: u.username,
    };
  } catch {
    return null;
  }
}

function stackFrames(err: Error) {
  // Sentry orders frames oldest-first; Error.stack is newest-first.
  const lines = (err.stack ?? "").split("\n").slice(1, 30).reverse();
  return lines
    .map((l) => l.trim().replace(/^at\s+/, ""))
    .filter(Boolean)
    .map((l) => ({ function: l, in_app: !l.includes("node_modules") }));
}

async function toSentry(dsn: string, err: Error, ctx: Ctx, level: string) {
  const parsed = parseDsn(dsn);
  if (!parsed) return;
  const body = {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: new Date().toISOString(),
    platform: "javascript",
    level,
    logger: "carkari",
    release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    environment: process.env.VERCEL_ENV ?? "development",
    server_name: process.env.VERCEL_REGION,
    tags: ctx,
    exception: {
      values: [
        {
          type: err.name || "Error",
          value: err.message || String(err),
          stacktrace: { frames: stackFrames(err) },
        },
      ],
    },
  };
  await fetch(parsed.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-sentry-auth": `Sentry sentry_version=7, sentry_client=carkari/1.0, sentry_key=${parsed.key}`,
    },
    body: JSON.stringify(body),
  });
}

async function toWebhook(url: string, err: Error, ctx: Ctx) {
  const where = ctx.url ? ` at \`${ctx.url}\`` : "";
  await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      content: `🚨 CarKari: ${err.name}: ${err.message}${where}`,
      text: `🚨 CarKari: ${err.name}: ${err.message}${where}`,
    }),
  });
}

/**
 * Report an error. Never throws and never rejects — a failure in the
 * reporting path must not become a second, louder failure.
 */
export async function reportError(
  error: unknown,
  ctx: Ctx = {},
  level: "error" | "fatal" | "warning" = "error"
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  // Always leave a trace in the platform logs, even with nothing configured.
  console.error("[carkari]", err.message, ctx);

  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  const hook = process.env.ALERT_WEBHOOK_URL;
  const jobs: Promise<unknown>[] = [];
  if (dsn) jobs.push(toSentry(dsn, err, ctx, level));
  if (hook) jobs.push(toWebhook(hook, err, ctx));
  if (!jobs.length) return;

  try {
    await Promise.allSettled(jobs);
  } catch {
    /* reporting must stay silent on failure */
  }
}
