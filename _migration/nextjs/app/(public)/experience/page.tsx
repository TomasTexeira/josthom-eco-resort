import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { contentApi } from "@/lib/api-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Experiencias", description: "Río Uruguay, fauna nativa, deportes y más en Josthom Eco Resort." };

const EXPERIENCES = [
  { icon: "🌊", title: "Río Uruguay", desc: "Pesca, kayak y baño en uno de los ríos más hermosos de Argentina. A pocos minutos del complejo." },
  { icon: "🌿", title: "Arroyo Sagastume", desc: "Caminatas por la orilla, aves autóctonas y atardeceres que no olvidarás." },
  { icon: "🏄", title: "Deportes acuáticos", desc: "Stand up paddle, kayak, pesca con mosca y más. El río es tu parque de diversiones." },
  { icon: "🦜", title: "Fauna nativa", desc: "Carpinchos, garzas, loros y una biodiversidad sorprendente en tu propia puerta." },
  { icon: "🏊", title: "Piscinas", desc: "Dos piscinas exteriores para relajarte después de un día de actividades." },
  { icon: "📶", title: "WiFi Starlink", desc: "Conectividad satellite de alta velocidad. Para los que no pueden desconectarse del todo." },
];

export default async function ExperiencePage() {
  const hero = await contentApi.get("experience").catch(() => null);

  return (
    <>
      {/* Hero */}
      <section className="relative h-72 flex items-center justify-center bg-amber-900">
        {hero?.image_url && (
          <Image src={hero.image_url} alt="Experiencias" fill className="object-cover opacity-40" priority />
        )}
        <div className="relative z-10 text-center text-white px-4 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold">{hero?.title || "Viví la experiencia"}</h1>
          {hero?.subtitle && <p className="mt-3 text-lg text-white/80">{hero.subtitle}</p>}
        </div>
      </section>

      {/* Grid de experiencias */}
      <section className="section-container py-16">
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
          {hero?.content || "En Josthom Eco Resort cada día trae una experiencia diferente. El río, la naturaleza y la tranquilidad del campo entrerriano te esperan."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXPERIENCES.map((exp) => (
            <div key={exp.title} className="card p-6 space-y-3 hover:shadow-md transition-shadow">
              <span className="text-4xl">{exp.icon}</span>
              <h2 className="text-lg font-semibold text-gray-900">{exp.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{exp.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section className="bg-amber-800 py-16 text-center px-4">
        <blockquote className="text-white text-2xl md:text-3xl font-light italic max-w-3xl mx-auto">
          &ldquo;El mejor antídoto para la ciudad es el silencio del campo y el sonido del río.&rdquo;
        </blockquote>
      </section>

      {/* CTA */}
      <section className="section-container py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Listo para vivir la experiencia?</h2>
        <Link href="/accommodations" className="btn-primary">Ver alojamientos disponibles</Link>
      </section>
    </>
  );
}
