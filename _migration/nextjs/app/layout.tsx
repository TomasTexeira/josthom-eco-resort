import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: {
    default: "Josthom Eco Resort | Villa Paranacito, Entre Ríos",
    template: "%s | Josthom Eco Resort",
  },
  description:
    "Complejo de cabañas eco-turísticas en Villa Paranacito, Entre Ríos. A orillas del Arroyo Sagastume y el Río Uruguay. Naturaleza, tranquilidad y aventura.",
  keywords: [
    "cabañas",
    "Villa Paranacito",
    "Entre Ríos",
    "ecoturismo",
    "río Uruguay",
  ],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://josthom-eco-resort.vercel.app",
    siteName: "Josthom Eco Resort",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <Analytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
