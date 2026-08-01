import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <Image
        src="/carkari-logo.png"
        alt="CarKari"
        width={958}
        height={128}
        quality={95}
        className="h-12 w-auto sm:h-16"
      />
      <h1 className="mt-8 text-4xl font-extrabold text-ink">404</h1>
      <p className="mt-2 max-w-md text-ink/70">
        Cette page n&apos;existe pas — mais nos voitures, si. / This page
        doesn&apos;t exist — but our cars do.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-accent-500 px-6 py-2.5 font-semibold text-white transition hover:bg-accent-400"
      >
        CarKari.com
      </Link>
    </main>
  );
}
