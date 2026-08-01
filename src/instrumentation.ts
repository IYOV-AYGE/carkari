/**
 * Next.js calls onRequestError for every uncaught server-side error — pages,
 * server actions, route handlers, middleware. This is the single hook that
 * catches the class of failure we hit before (the middleware 500 that took the
 * whole site down and that we only found by looking).
 */
import { reportError } from "@/lib/observability/report";

export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string; headers?: Record<string, string> },
  context: { routerKind?: string; routePath?: string; renderSource?: string }
) {
  await reportError(error, {
    url: request?.path,
    method: request?.method,
    route: context?.routePath,
    router: context?.routerKind,
    source: context?.renderSource,
  });
}

export async function register() {
  // Reserved for future startup wiring (tracing, metrics).
}
