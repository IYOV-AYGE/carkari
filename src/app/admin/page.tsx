import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { setAgencyStatus, getDocUrl } from "./actions";

export const metadata = { title: "Admin" };

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800",
  verified: "bg-green-50 text-green-800",
  suspended: "bg-red-50 text-red-700",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") redirect("/");

  const { data: agencies } = await supabase
    .from("agencies")
    .select("id, legal_name, city, status, contact_email, phone, rc_number, rc_doc_path, insurance_doc_path, created_at, strikes")
    .order("created_at", { ascending: false });

  const withUrls = await Promise.all(
    (agencies ?? []).map(async (a) => ({
      ...a,
      rcUrl: a.rc_doc_path ? await getDocUrl(a.rc_doc_path) : null,
      insUrl: a.insurance_doc_path ? await getDocUrl(a.insurance_doc_path) : null,
    }))
  );

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-extrabold text-brand-950">
          Admin — Agences ({withUrls.length})
        </h1>

        <div className="mt-6 space-y-4">
          {withUrls.length === 0 && (
            <p className="rounded-2xl border border-dashed border-brand-950/20 p-10 text-center text-brand-950/60">
              Aucune candidature pour le moment.
            </p>
          )}
          {withUrls.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-brand-950/10 bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-brand-950">
                    {a.legal_name}{" "}
                    <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status] ?? ""}`}>
                      {a.status}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-brand-950/60">
                    {a.city} · {a.contact_email} · {a.phone} · RC {a.rc_number}
                    {a.strikes > 0 && ` · ${a.strikes} strike(s)`}
                  </p>
                  <p className="mt-1 space-x-3 text-sm">
                    {a.rcUrl && (
                      <a href={a.rcUrl} target="_blank" className="font-medium text-accent-600 hover:underline">
                        Registre de commerce ↗
                      </a>
                    )}
                    {a.insUrl && (
                      <a href={a.insUrl} target="_blank" className="font-medium text-accent-600 hover:underline">
                        Assurance ↗
                      </a>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {a.status !== "verified" && (
                    <form action={setAgencyStatus}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="status" value="verified" />
                      <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500">
                        Approuver
                      </button>
                    </form>
                  )}
                  {a.status !== "suspended" && (
                    <form action={setAgencyStatus}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="status" value="suspended" />
                      <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">
                        Suspendre
                      </button>
                    </form>
                  )}
                  {a.status !== "pending" && (
                    <form action={setAgencyStatus}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="status" value="pending" />
                      <button className="rounded-lg border border-brand-950/15 px-4 py-2 text-sm font-semibold text-brand-950 hover:bg-brand-950/5">
                        Re-vérifier
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
