import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import AccommodationCard from '@/components/accommodations/AccommodationCard';

export default function Accommodations() {
  const { data: accommodations, isLoading } = useQuery({
    queryKey: ['accommodations'],
    queryFn: () => base44.entities.Accommodation.list('order'),
  });

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1920&q=80"
            alt="Alojamientos"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center px-6"
        >
          <p className="text-amber-200 tracking-[0.3em] uppercase text-sm mb-4">
            Nuestros Espacios
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white mb-4">
            Alojamientos
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-lg">
            Cabañas y casas diseñadas para el confort, rodeadas de naturaleza
          </p>
        </motion.div>
      </section>

      {/* Accommodations Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
            </div>
          ) : accommodations?.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-stone-500 text-lg">
                Próximamente mostraremos nuestros alojamientos disponibles.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {accommodations?.map((accommodation, index) => (
                <AccommodationCard
                  key={accommodation.id}
                  accommodation={accommodation}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}