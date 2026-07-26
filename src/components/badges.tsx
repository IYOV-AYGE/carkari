import Link from "next/link";

/** Green check pill shown next to agency names. */
export function VerifiedBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-green-100 font-medium text-green-800 ${small ? "px-1.5 py-0 text-[11px]" : "px-2 py-0.5 text-xs"}`}
      title="Agence vérifiée par CarKari"
    >
      ✓ vérifiée
    </span>
  );
}

/** Promo bar above the navbar. */
export function AnnouncementBanner() {
  return (
    <div className="bg-accent-600 px-4 py-2 text-center text-sm font-medium text-white">
      Lancement CarKari — annulation gratuite 24 h sur toutes les réservations.{" "}
      <Link href="/aide" className="underline underline-offset-2 hover:opacity-90">
        En savoir plus
      </Link>
    </div>
  );
}

/** Floating WhatsApp contact button (number set at launch). */
export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/212600000000?text=Bonjour%20CarKari%20!"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Nous contacter sur WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
        <path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07a8.2 8.2 0 0 1-2.4-1.49 9 9 0 0 1-1.66-2.07c-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.11 3.22 5.1 4.51.71.3 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" />
        <path d="M12.05 2a9.9 9.9 0 0 0-8.57 14.84L2 22l5.3-1.39A9.9 9.9 0 1 0 12.05 2Zm0 18.1a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 1 1 6.96 3.86Z" />
      </svg>
    </a>
  );
}
