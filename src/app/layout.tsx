import "./globals.css";
import { AnnouncementBanner, WhatsAppButton } from "@/components/badges";
import { getLang } from "@/lib/i18n/server";

export async function generateMetadata() {
  const lang = await getLang();
  return {
    title: {
      default:
        lang === "fr"
          ? "CarKari — Location de voiture au Maroc"
          : "CarKari — Car rental in Morocco",
      template: "%s | CarKari",
    },
    description:
      lang === "fr"
        ? "Louez une voiture auprès d'agences vérifiées partout au Maroc. Réservation en ligne, paiement sécurisé."
        : "Rent a car from verified agencies across Morocco. Online booking, secure payment.",
    metadataBase: new URL("https://www.carkari.com"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getLang();
  return (
    <html lang={lang} className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <AnnouncementBanner />
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
