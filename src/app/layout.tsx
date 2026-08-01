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
    // Search results, shared links and browser tabs all read these.
    applicationName: "CarKari",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.png", type: "image/png", sizes: "192x192" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
    },
    openGraph: {
      type: "website",
      siteName: "CarKari",
      url: "https://www.carkari.com",
      images: [{ url: "/carkari-logo.png", width: 958, height: 128 }],
    },
  };
}

// Colours the browser chrome on Android and the status bar on iOS PWAs.
export const viewport = {
  themeColor: "#2278c9",
};

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
