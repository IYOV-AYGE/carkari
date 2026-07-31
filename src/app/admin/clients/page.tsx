import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { setKyc, getCustomerDocUrl } from "../actions";

export const metadata = { title: "Admin — vérifications clients" };

type Row = {
  id: string; full_name: string | null; first_name: string | null;
  last_name: string | null; birth_date: string | null; nationality: string | null;
  is_resident: boolean | null;
  phone: string | null; email: string | null; email_confirmed: boolean;
  address_line: string | null; address_city: string | null;
  address_postcode: string | null; address_country: string | null;
  id_number: string | null; passport_number: string | null;
  licence_number: string | null;
  licence_country: string | null; licence_issued_on: string | null;
  licence_front_path: string | null; licence_back_path: string | null;
  id_front_path: string | null; id_back_path: string | null;
  idp_path: string | null; selfie_path: string | null;
  kyc_status: string;
  kyc_submitted_at: string | null; kyc_ip: string | null;
  kyc_country: string | null;
};

const STATUS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800",
  verified: "bg-green-50 text-green-800",
  rejected: "bg-red-50 text-red-700",
};

export default async function AdminClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=%2Fadmin%2Fclients");
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") redirect("/");

  const { data } = await supabase.rpc("admin_kyc_queue");
  const rows = (data ?? []) as Row[];

  const withUrls = await Promise.all(
    rows.map(async (r) => ({
      ...r,
      docs: (
        await Promise.all(
          (
            [
              ["Permis recto", r.licence_front_path],
              ["Permis verso", r.licence_back_path],
              [r.is_resident ? "CIN recto" : "Passeport", r.id_front_path],
              ["CIN verso", r.id_back_path],
              ["Permis international", r.idp_path],
              ["Selfie", r.selfie_path],
            ] as [string, string | null][]
          ).map(async ([label, path]) =>
            path ? ([label, await getCustomerDocUrl(path)] as [string, string | null]) : null
          )
        )
      ).filter(Boolean) as [string, string | null][],
    }))
  );

  const age = (d: string | null) =>
    d ? Math.floor((Date.now() - new Date(d).getTime()) / 31557600000) : null;

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-extrabold text-brand-950">
            Vérifications clients ({withUrls.filter((r) => r.kyc_status === "pending").length} en attente)
          </h1>
          <Link href="/admin" className="text-sm font-semibold text-accent-600 hover:underline">
            → Agences
          </Link>
        </div>

        <p className="mt-2 text-sm text-brand-950/55">
          À contrôler : le selfie correspond à la photo du document, le nom et la
          date de naissance sont identiques partout, le permis est valide et
          détenu depuis plus d&apos;un an, l&apos;email est confirmé.
        </p>

        <div className="mt-6 space-y-4">
          {withUrls.length === 0 && (
            <p className="rounded-2xl border border-dashed border-brand-950/20 p-10 text-center text-brand-950/60">
              Aucune demande de vérification.
            </p>
          )}

          {withUrls.map((r) => (
            <div key={r.id} className="rounded-2xl border border-brand-950/10 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-brand-950">
                    {r.first_name} {r.last_name}{" "}
                    <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[r.kyc_status] ?? ""}`}>
                      {r.kyc_status}
                    </span>
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        r.email_confirmed
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {r.email_confirmed ? "✓ email" : "email non confirmé"}
                    </span>
                    <span className="ml-1 rounded-full bg-brand-950/[0.06] px-2 py-0.5 text-[11px] font-medium text-brand-950/70">
                      {r.is_resident ? "résident" : "visiteur"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-brand-950/65">
                    {r.email} · {r.phone ?? "—"} · {r.nationality ?? "—"}
                    {r.birth_date && ` · né(e) ${r.birth_date} (${age(r.birth_date)} ans)`}
                  </p>
                  <p className="text-sm text-brand-950/65">
                    {r.is_resident
                      ? `CIN ${r.id_number ?? "—"}`
                      : `Passeport ${r.passport_number ?? "—"}`}{" "}
                    · Permis {r.licence_number ?? "—"} ({r.licence_country ?? "—"},
                    délivré {r.licence_issued_on ?? "—"})
                  </p>
                  <p className="text-sm text-brand-950/65">
                    {[r.address_line, r.address_postcode, r.address_city, r.address_country]
                      .filter(Boolean)
                      .join(", ") || "Adresse —"}
                  </p>
                  <p className="mt-1 text-xs text-brand-950/45">
                    {r.kyc_ip && `IP ${r.kyc_ip}`}
                    {r.kyc_country && ` · ${r.kyc_country}`}
                    {r.kyc_submitted_at &&
                      ` · ${new Date(r.kyc_submitted_at).toLocaleString("fr-MA")}`}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                    {r.docs.map(([label, url]) =>
                      url ? (
                        <a
                          key={label}
                          href={url}
                          target="_blank"
                          className="font-medium text-accent-600 hover:underline"
                        >
                          {label} ↗
                        </a>
                      ) : null
                    )}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {r.kyc_status !== "verified" && (
                    <form action={setKyc}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="verified" />
                      <button className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500">
                        Approuver
                      </button>
                    </form>
                  )}
                  <form action={setKyc} className="flex gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <input
                      name="reason"
                      placeholder="Motif du refus"
                      className="w-40 rounded-lg border border-brand-950/15 px-2 py-1.5 text-sm"
                    />
                    <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">
                      Refuser
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
