import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin — journal d'audit" };

type Row = {
  at: string;
  actor_email: string | null;
  action: string;
  subject_id: string | null;
  subject_name: string | null;
  detail: Record<string, unknown> | null;
  ip: string | null;
};

const LABEL: Record<string, { text: string; cls: string }> = {
  kyc_doc_view: {
    text: "document client consulté",
    cls: "bg-amber-50 dark:bg-amber-400/15 text-amber-800 dark:text-amber-200",
  },
  agency_doc_view: {
    text: "document agence consulté",
    cls: "bg-amber-50 dark:bg-amber-400/15 text-amber-800 dark:text-amber-200",
  },
  kyc_decision: {
    text: "décision vérification",
    cls: "bg-green-50 dark:bg-green-500/15 text-green-800 dark:text-green-300",
  },
  agency_status: {
    text: "statut agence",
    cls: "bg-green-50 dark:bg-green-500/15 text-green-800 dark:text-green-300",
  },
};

export default async function AuditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=%2Fadmin%2Fjournal");
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") redirect("/");

  const { data } = await supabase.rpc("admin_audit_feed", { p_limit: 300 });
  const rows = (data ?? []) as Row[];

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-extrabold text-ink">Journal d&apos;audit</h1>
          <Link href="/admin" className="text-sm font-semibold text-accent-600 hover:underline">
            → Agences
          </Link>
          <Link href="/admin/clients" className="text-sm font-semibold text-accent-600 hover:underline">
            → Clients
          </Link>
        </div>
        <p className="mt-2 text-sm text-ink/55">
          Chaque consultation de pièce d&apos;identité et chaque décision est
          enregistrée ici. Le journal est en écriture seule : il ne peut être ni
          modifié ni effacé, y compris par un administrateur.
        </p>

        {rows.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-ink/20 p-10 text-center text-ink/60">
            Aucun événement enregistré.
          </p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink/[0.04] text-xs uppercase tracking-wide text-ink/55">
                <tr>
                  <th className="px-4 py-3 font-semibold">Quand</th>
                  <th className="px-4 py-3 font-semibold">Qui</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Concerne</th>
                  <th className="px-4 py-3 font-semibold">Détail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {rows.map((r, i) => {
                  const l = LABEL[r.action] ?? {
                    text: r.action,
                    cls: "bg-ink/[0.06] text-ink/70",
                  };
                  const d = r.detail ?? {};
                  const doc = typeof d.document === "string" ? d.document.split("/").pop() : null;
                  return (
                    <tr key={i} className="bg-card align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-ink/70">
                        {new Date(r.at).toLocaleString("fr-MA")}
                      </td>
                      <td className="px-4 py-3 text-ink/80">{r.actor_email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${l.cls}`}>
                          {l.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink/80">{r.subject_name ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-ink/55">
                        {doc ?? (d.status ? String(d.status) : "—")}
                        {r.ip && <span className="ml-2 font-mono">{r.ip}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
