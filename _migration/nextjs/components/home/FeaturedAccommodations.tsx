import Link from "next/link";
import Image from "next/image";
import { Users, ArrowRight } from "lucide-react";
import type { Accommodation } from "@/lib/api-client";

interface Props { accommodations: Accommodation[]; }

function AccCard({ acc }: { acc: Accommodation }) {
  return (
    <Link
      href={`/accommodations/${acc.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
    >
      {/* Foto */}
      <div className="relative h-56 overflow-hidden bg-gray-100">
        {acc.main_image ? (
          <Image
            src={acc.main_image}
            alt={acc.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 33vw"
            loading="lazy"
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

      {/* Info */}
      <div className="p-5 space-y-2">
        <h3 className="font-display font-bold text-gray-900 text-lg group-hover:text-brand-600 transition-colors duration-200">
          {acc.name}
        </h3>
        {acc.short_description && (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {acc.short_description}
          </p>
        )}
        <div className="flex items-center gap-1.5 pt-1 text-xs text-gray-400">
          <Users size={13} />
          <span>Hasta {acc.capacity} personas</span>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedAccommodations({ accommodations }: Props) {
  if (accommodations.length === 0) return null;

  return (
    <section className="py-24 bg-white">
      <div className="section-container space-y-12">

        {/* Header */}
        <div className="text-center space-y-3">
          <p className="section-label">Alojamientos</p>
          <h2 className="section-title">Donde el confort se encuentra con la naturaleza</h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm mt-2">
            Cabañas y casas equipadas con todo lo necesario para una estadía inolvidable.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {accommodations.map((acc) => (
            <AccCard key={acc.id} acc={acc} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/accommodations"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:border-brand-600 hover:text-brand-600 transition-colors duration-200"
          >
            Ver todos los alojamientos <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
