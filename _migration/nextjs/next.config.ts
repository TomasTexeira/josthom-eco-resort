import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (imágenes actuales del proyecto)
      { protocol: "https", hostname: "qtrypzzcjebvfcihiynt.supabase.co" },
      { protocol: "https", hostname: "rsqsoyrmqbnxqqxsauxk.supabase.co" },
      // Unsplash (placeholders)
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // Permite acceder a variables de entorno en el cliente con NEXT_PUBLIC_
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL!,
    NEXT_PUBLIC_MP_PUBLIC_KEY: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || "",
  },
  /**
   * Proxy reverso: el browser llama a /api/* en localhost:3000
   * y Next.js lo reenvía a FastAPI en localhost:8000 (o la URL del NAS en producción).
   * Esto elimina completamente los errores CORS en el browser.
   */
  async rewrites() {
    const apiTarget =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiTarget}/api/:path*`,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
