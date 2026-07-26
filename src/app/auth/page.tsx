import { AuthForm } from "@/components/AuthForm";
import { getDict, getLang } from "@/lib/i18n/server";

export async function generateMetadata() {
  return { title: (await getLang()) === "fr" ? "Connexion" : "Sign in" };
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const t = await getDict();
  const { mode } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center bg-brand-950/[0.03] px-4 py-16">
      <AuthForm t={t.auth} defaultMode={mode === "signup" ? "signup" : "login"} />
    </main>
  );
}
