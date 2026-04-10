import Link from "next/link";
import Image from "next/image";
import { Users, ArrowRight } from "lucide-react";
import type { Accommodation } from "@/lib/api-client";

interface Props { accommodations: Accommodation[]; }

function AccCard({ acc }: { acc: Accommodation }) {
  return (
    <Link href={`/accommodations/${acc.id}`} className="group card hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-52 overflow-hidden">
        {acc.main_image ? (
          <Image
            src={acc.main_image}
            alt={acc.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 33vw"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-600 text-sm">Sin imagen</div>
        )}
        {acc.is_featured && (
          <span className="absolute top-3 left-3 bg-green-700 text-white text-xs font-medium px-2 py-1 rounded-full">
            Destacado
          </span>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-900 group-hover:text-green-800 transition-colors">{acc.name}</h3>
        {acc.short_description && (
          <p className="text-sm text-gray-500 line-clamp-2">{acc.short_description}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Users size={13} /> {acc.capacity} huéspedes
          </span>
          <span className="text-xs font-medium text-green-700 group-hover:underline flex items-center gap-1">
            Ver más <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedAccommodations({ accommodations }: Props) {
  if (accommodations.length === 0) return null;

  return (
    <section className="bg-gray-50 py-20">
      <div className="section-container space-y-10">
        <div className="text-center space-y-2">
          <p className="text-green-700 text-sm font-semibold uppercase tracking-widest">Alojamientos</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Nuestras cabañas</h2>
          <p className="text-gray-500 max-w-xl mx-auto">6 opciones únicas para cada tipo de estadía, desde escapadas en pareja hasta familias.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {accommodations.map((acc) => (
            <AccCard key={acc.id} acc={acc} />
          ))}
        </div>

        <div className="text-center">
          <Link href="/accommodations" className="btn-outline inline-flex gap-2">
            Ver todos los alojamientos <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
