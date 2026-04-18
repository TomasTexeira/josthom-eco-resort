import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Users, BedDouble, Bath } from "lucide-react";
import { accommodationsApi, contentApi, type Accommodation } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alojamientos",
  description: "Conocé nuestras cabañas en Villa Paranacito. Capacidad para familias, parejas y grupos.",
};

function AccommodationCard({ acc }: { acc: Accommodation }) {
  return (
    <Link
      href={`/accommodations/${acc.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 block"
    >
      <div className="relative h-56 overflow-hidden bg-gray-100">
        {acc.main_image ? (
          <Image
            src={acc.main_image}
            alt={acc.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Sin imagen
          </div>
        )}
        {acc.is_featured && (
          <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Destacado
          </span>
        )}
      </div>
      <div className="p-5 space-y-3">
        <h2 className="font-display font-bold text-lg text-gray-900 group-hover:text-brand-600 transition-colors duration-200">
          {acc.name}
        </h2>
        {acc.short_description && (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{acc.short_description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
          <span className="flex items-center gap-1"><Users size={13} /> {acc.capacity} huésp.</span>
          <span className="flex items-center gap-1"><BedDouble size={13} /> {acc.bedrooms} dorm.</span>
          <span className="flex items-center gap-1"><Bath size={13} /> {acc.bathrooms} baño{acc.bathrooms !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </Link>
  );
}

export default async function AccommodationsPage() {
  const [accommodations, heroContent] = await Promise.allSettled([
    accommodationsApi.list(),
    contentApi.get("hero"),
  ]);

  const accs = accommodations.status === "fulfilled" ? accommodations.value : [];
  const hero = heroContent.status === "fulfilled" ? heroContent.value : null;

  return (
    <>
      {/* Hero banner oscuro */}
      <section className="relative h-64 flex items-center justify-center bg-charcoal-900 overflow-hidden">
        {hero?.image_url && (
          <Image
            src={hero.image_url}
            alt="Alojamientos"
            fill
            className="object-cover opacity-40"
            priority
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4 space-y-2">
          <p className="section-label text-brand-400">Alojamientos</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold">Nuestras cabañas</h1>
          <p className="text-white/70 text-sm mt-2">Cabañas para cada tipo de estadía</p>
        </div>
      </section>

      {/* Grid */}
      <section className="section-container py-16">
        {accs.length === 0 ? (
          <p className="text-center text-gray-500 py-16">No hay alojamientos disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {accs.map((acc) => (
              <AccommodationCard key={acc.id} acc={acc} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
