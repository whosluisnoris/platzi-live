import type { Metadata } from "next";
import { Bricolage_Grotesque, Roboto } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import "./globals.css";

// Bricolage Grotesque para títulos (display), Roboto para el resto del texto.
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const roboto = Roboto({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// URL canónica de producción (se usa como base para resolver enlaces absolutos
// de Open Graph / Twitter, que las redes sociales exigen).
const SITE_URL = "https://clusly.com";
const DEFAULT_TITLE = `${SITE_NAME} — recursos de tecnología curados por la comunidad`;
const OG_DESCRIPTION = `${SITE_TAGLINE} Playlists y videos de tecnología curados por temática, aportados y votados por la comunidad — gratis y en español.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: OG_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Clusly",
    "aprender tecnología",
    "cursos gratis",
    "YouTube",
    "IA",
    "programación",
    "datos",
    "playlists",
    "español",
    "Platzi Lives",
  ],
  authors: [{ name: "Luis Noris", url: "https://www.linkedin.com/in/luisnorisgarcia/" }],
  creator: "Luis Noris",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: OG_DESCRIPTION,
    url: SITE_URL,
    locale: "es_MX",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: OG_DESCRIPTION,
    images: ["/og.png"],
  },
};

// Fija el tema antes del primer paint: elección guardada o preferencia del sistema.
const themeScript = `(function(){try{var t=localStorage.getItem('pl_theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-theme="dark"
      suppressHydrationWarning
      className={`${bricolage.variable} ${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-clip bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
