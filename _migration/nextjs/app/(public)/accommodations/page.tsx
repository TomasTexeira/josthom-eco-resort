/**
 * Página de alojamientos — migrada desde src/pages/Accommodations.jsx
 * Server Component con ISR.
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Users, BedDouble, Bath } from "lucide-react";
import { accommodationsApi, contentApi, type Accommodation } from "@/lib/api-client";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Alojamientos",
  description: "Conocé nuestras 6 cabañas en Villa Paranacito. Capacidad para familias, parejas y grupos.",
};

function AccommodationCard({ acc }: { acc: Accommodation }) {
  return (
    <Link href={`/accommodations/${acc.id}`} className="group block card hover:shadow-md transition-shadow">
      <div className="relative h-56 overflow-hidden">
        {acc.main_image ? (
          <Image
            src={acc.main_image}
            alt={acc.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 text-sm">Sin imagen</span>
          </div>
        )}
      </div>
      <div className="p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-green-800 transition-colors">
          {acc.name}
        </h2>
        {acc.short_description && (
          <p className="text-sm text-gray-500 line-clamp-2">{acc.short_description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1"><Users size={14} /> {acc.capacity} huésp.</span>
          <span className="flex items-center gap-1"><BedDouble size={14} /> {acc.bedrooms} dorm.</span>
          <span className="flex items-center gap-1"><Bath size={14} /> {acc.bathrooms} baño{acc.bathrooms !== 1 ? "s" : ""}</span>
        </div>
        <span className="inline-block text-sm font-medium text-green-700 group-hover:underline">
          Ver detalles →
        </span>
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
      {/* Hero */}
      <section className="relative h-64 flex items-center justify-center bg-green-900">
        {hero?.image_url && (
          <Image src={hero.image_url} alt="Alojamientos" fill className="object-cover opacity-40" priority />
        )}
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl font-bold">Nuestros Alojamientos</h1>
          <p className="mt-2 text-white/80">6 cabañas para cada tipo de estadía</p>
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
