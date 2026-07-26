import { cookies } from "next/headers";
import { cache } from "react";
import { DICTS, type Dict, type Lang } from "./dict";

/** Language for this request: cookie set by middleware (geo) or user override. */
export const getLang = cache(async (): Promise<Lang> => {
  const c = (await cookies()).get("lang")?.value;
  return c === "en" ? "en" : "fr";
});

export async function getDict(): Promise<Dict> {
  return DICTS[await getLang()];
}

/** Tiny placeholder interpolation: tpl("Popular in {city}", {city: "Rabat"}) */
export function tpl(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
