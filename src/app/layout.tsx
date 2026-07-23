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

export const metadata: Metadata = {
  title: `${SITE_NAME} — recursos para aprender IA y datos, en orden`,
  description:
    `${SITE_TAGLINE} Playlists y videos de YouTube curados por temática (IA, agentes, datos) más los lives de Platzi.`,
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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
