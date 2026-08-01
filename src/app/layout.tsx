import "./globals.css";
import { cookies } from "next/headers";
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
  themeColor: "#0d1b2a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getLang();
  // Read the saved choice server-side so the first paint is already correct.
  const theme = (await cookies()).get("theme")?.value;

  return (
    <html
      lang={lang}
      className={`h-full antialiased${theme === "dark" ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <head>
        {/*
          First-time visitors have no cookie. This runs before paint, follows
          their OS preference, and writes the cookie so every later request is
          server-rendered in the right theme.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(document.cookie.indexOf('theme=')===-1&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');document.cookie='theme=dark; path=/; max-age=31536000; samesite=lax';}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <AnnouncementBanner />
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
