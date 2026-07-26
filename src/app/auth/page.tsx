import { AuthForm } from "@/components/AuthForm";
import { getDict, getLang } from "@/lib/i18n/server";

export async function generateMetadata() {
  return { title: (await getLang()) === "fr" ? "Connexion" : "Sign in" };
}

export default async function AuthPage() {
  const t = await getDict();
  return (
    <main className="flex flex-1 items-center justify-center bg-brand-950/[0.03] px-4 py-16">
      <AuthForm t={t.auth} />
    </main>
  );
}
