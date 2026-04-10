import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Josthom Eco Resort | Villa Paranacito, Entre Ríos",
    template: "%s | Josthom Eco Resort",
  },
  description:
    "Complejo de cabañas eco-turísticas en Villa Paranacito, Entre Ríos. A orillas del Arroyo Sagastume y el Río Uruguay. Naturaleza, tranquilidad y aventura.",
  keywords: ["cabañas", "Villa Paranacito", "Entre Ríos", "ecoturismo", "río Uruguay"],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://josthom-eco-resort.vercel.app",
    siteName: "Josthom Eco Resort",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
