import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CarKari — Location de voiture au Maroc",
    template: "%s | CarKari",
  },
  description:
    "Louez une voiture auprès d'agences vérifiées partout au Maroc. Réservation en ligne, paiement sécurisé.",
  metadataBase: new URL("https://www.carkari.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
