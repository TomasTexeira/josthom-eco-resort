import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FeaturedAccommodations({ accommodations }) {
  const featured = accommodations?.filter(a => a.is_featured).slice(0, 3) || accommodations?.slice(0, 3) || [];

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-amber-700 tracking-[0.2em] uppercase text-sm mb-4 font-medium">
            Alojamientos
          </p>
          <h2 className="text-4xl md:text-5xl font-light text-stone-800 mb-4">
            Donde el confort se encuentra con la naturaleza
          </h2>
          <p className="text-stone-500 max-w-2xl mx-auto">
            Cabañas y casas equipadas con todo lo necesario para una estadía inolvidable
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featured.map((accommodation, index) => (
            <motion.div
              key={accommodation.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Link to={`${createPageUrl("AccommodationDetail")}?id=${accommodation.id}`}>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-5 relative">
                  <img
                    src={accommodation.main_image || "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=600&q=80"}
                    alt={accommodation.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-medium text-stone-800 mb-2 group-hover:text-amber-700 transition-colors">
                      {accommodation.name}
                    </h3>
                    <p className="text-stone-500 text-sm mb-3 line-clamp-2">
                      {accommodation.short_description || accommodation.description?.substring(0, 80)}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-stone-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Hasta {accommodation.capacity} personas
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link to={createPageUrl("Accommodations")}>
            <Button 
              variant="outline" 
              size="lg"
              className="border-stone-300 text-stone-700 hover:bg-stone-50 group"
            >
              Ver todos los alojamientos
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}