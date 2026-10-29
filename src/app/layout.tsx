import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { asset } from "@/lib/base";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/themes";
import { AppShell } from "@/components/app-shell";

// Títulos con una serif suave y cálida (elegante sin ser fría); texto en Nunito, redondeado y legible.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${BRAND.app} · ${BRAND.tagline}`,
  description:
    "Recetas, temporizadores, tu dinero real (ingresos, gastos y pagos fijos) y un juego de pastelería, todo en un solo lugar.",
  applicationName: BRAND.app,
  manifest: asset("/manifest.webmanifest"),
  icons: { icon: asset("/icons/icon-192.png"), apple: asset("/icons/apple-touch-icon.png") },
  appleWebApp: { capable: true, title: BRAND.app, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f7c6d9",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

// Aplica el tema guardado antes de pintar para evitar parpadeo.
const themeScript = `try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})||${JSON.stringify(DEFAULT_THEME)};document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
      className={`${fraunces.variable} ${nunito.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
