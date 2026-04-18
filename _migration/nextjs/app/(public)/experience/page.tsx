import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { contentApi } from "@/lib/api-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "La Experiencia",
  description: "Río Uruguay, fauna nativa, deportes y más en Josthom Eco Resort.",
};

const EXPERIENCES = [
  { icon: "🌊", title: "Río Uruguay",        desc: "Pesca, kayak y baño en uno de los ríos más hermosos de Argentina. A pocos minutos del complejo." },
  { icon: "🌿", title: "Arroyo Sagastume",   desc: "Caminatas por la orilla, aves autóctonas y atardeceres que no olvidarás." },
  { icon: "🏄", title: "Deportes acuáticos", desc: "Stand up paddle, kayak, pesca con mosca y más. El río es tu parque de diversiones." },
  { icon: "🦜", title: "Fauna nativa",        desc: "Carpinchos, garzas, loros y una biodiversidad sorprendente en tu propia puerta." },
  { icon: "🏊", title: "Piscinas",            desc: "Dos piscinas exteriores para relajarte después de un día de actividades." },
  { icon: "📶", title: "WiFi Starlink",       desc: "Conectividad satelital de alta velocidad en todo el complejo." },
];

const BG_HERO = "https://rsqsoyrmqbnxqqxsauxk.supabase.co/storage/v1/object/public/Fotos%20josthom/fotosjosthomcabanas/a4955305-7459-405e-9cbb-d7b1ba61725e.JPG";

export default async function ExperiencePage() {
  const hero = await contentApi.get("experience").catch(() => null);

  return (
    <>
      {/* Hero banner oscuro */}
      <section className="relative h-72 flex items-center justify-center bg-charcoal-900 overflow-hidden">
        <Image
          src={hero?.image_url || BG_HERO}
          alt="La Experiencia Josthom"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4 max-w-2xl space-y-3">
          <p className="section-label text-brand-400">La experiencia</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            {hero?.title || "Vivir el campo como debe ser"}
          </h1>
          {hero?.subtitle && (
            <p className="text-white/70 text-base">{hero.subtitle}</p>
          )}
        </div>
      </section>

      {/* Intro */}
      <section className="section-container py-16 text-center max-w-3xl mx-auto">
        <p className="text-gray-600 leading-relaxed text-lg">
          {hero?.content ||
            "En Josthom Eco Resort cada día trae una experiencia diferente. El río, la naturaleza y la tranquilidad del campo entrerriano te esperan."}
        </p>
      </section>

      {/* Grid de experiencias */}
      <section className="section-container pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXPERIENCES.map((exp) => (
            <div
              key={exp.title}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 space-y-4 hover:shadow-md transition-shadow duration-300"
            >
              <span className="text-4xl">{exp.icon}</span>
              <h2 className="font-display text-lg font-bold text-gray-900">{exp.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{exp.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quote — sección oscura */}
      <section className="bg-charcoal-900 py-20 text-center px-4">
        <p className="section-label text-brand-500 mb-4">Nuestra filosofía</p>
        <blockquote className="font-display text-white text-2xl md:text-3xl font-bold italic max-w-3xl mx-auto leading-relaxed">
          &ldquo;El mejor antídoto para la ciudad es el silencio del campo y el sonido del río.&rdquo;
        </blockquote>
      </section>

      {/* CTA */}
      <section className="section-container py-20 text-center space-y-5">
        <p className="section-label">¿Listo para vivir la experiencia?</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900">
          Tu escape al campo te espera
        </h2>
        <div className="pt-2">
          <Link href="/accommodations" className="btn-primary px-8 py-3.5">
            Ver alojamientos disponibles
          </Link>
        </div>
      </section>
    </>
  );
}
