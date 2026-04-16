/**
 * Home page - Migrada desde src/pages/Home.jsx
 * Usa ISR (revalidate cada 10 minutos) para SEO óptimo.
 */
import { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import FeaturedAccommodations from "@/components/home/FeaturedAccommodations";
import ExperiencePreview from "@/components/home/ExperiencePreview";
import CTASection from "@/components/home/CTASection";
import { contentApi, accommodationsApi } from "@/lib/api-client";

// ISR: regenerar cada 10 minutos
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Josthom Eco Resort | Cabañas en Villa Paranacito",
  description:
    "Complejo de 6 cabañas eco-turísticas en Villa Paranacito, Entre Ríos. Naturaleza, río Uruguay y tranquilidad.",
};

export default async function HomePage() {
  // Server-side data fetching (reemplaza useQuery en el componente)
  const [heroContent, aboutContent, accommodations] = await Promise.allSettled([
    contentApi.get("hero"),
    contentApi.get("about"),
    accommodationsApi.featured(),
  ]);

  const hero = heroContent.status === "fulfilled" ? heroContent.value : null;
  const about = aboutContent.status === "fulfilled" ? aboutContent.value : null;
  const featured = accommodations.status === "fulfilled" ? accommodations.value : [];

  return (
    <>
      <HeroSection content={hero} />
      <AboutSection content={about} />
      <FeaturedAccommodations accommodations={featured} />
      <ExperiencePreview />
      <CTASection />
    </>
  );
}
