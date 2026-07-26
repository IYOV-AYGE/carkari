import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export function ContentPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="bg-brand-950 px-4 py-12 text-white">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-3 text-brand-100/80">{subtitle}</p>}
          </div>
        </section>
        <section className="mx-auto max-w-3xl space-y-8 px-4 py-12 leading-relaxed text-brand-950/80">
          {children}
        </section>
      </main>
      <Footer />
    </>
  );
}

export function Section({ h, children }: { h: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-brand-950">{h}</h2>
      {children}
    </div>
  );
}
