import { AuthForm } from "@/components/AuthForm";
import { getDict, getLang } from "@/lib/i18n/server";
import { safeNext } from "@/lib/auth/next";

export async function generateMetadata() {
  return { title: (await getLang()) === "fr" ? "Connexion" : "Sign in" };
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; next?: string }>;
}) {
  const t = await getDict();
  const { mode, next } = await searchParams;
  const target = safeNext(next);
  // Someone arriving from the agency application is becoming a HOST, not a
  // customer. Same account either way, but the page must say so — otherwise
  // it reads as "we ignored what you clicked and signed you up as a client".
  const asHost = Boolean(target?.startsWith("/partenaires"));

  return (
    <main className="flex flex-1 items-center justify-center bg-brand-950/[0.03] px-4 py-16">
      <AuthForm
        t={t.auth}
        defaultMode={mode === "signup" ? "signup" : "login"}
        next={target}
        asHost={asHost}
      />
    </main>
  );
}
