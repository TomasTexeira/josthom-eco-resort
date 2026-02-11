import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Bed, Bath, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AccommodationCard({ accommodation, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={accommodation.main_image || "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=600&q=80"}
          alt={accommodation.name}
          loading="lazy"
          decoding="async"
          width="600"
          height="450"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4">
          <Badge className="bg-white/90 text-stone-800 backdrop-blur-sm capitalize">
            {accommodation.type}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-2xl font-light text-stone-800 mb-2">
          {accommodation.name}
        </h3>
        
        <p className="text-stone-500 text-sm mb-4 line-clamp-2">
          {accommodation.short_description || accommodation.description}
        </p>

        {/* Features */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm text-stone-600">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-700" />
            <span>{accommodation.capacity} huéspedes</span>
          </div>
          {accommodation.bedrooms && (
            <div className="flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-amber-700" />
              <span>{accommodation.bedrooms} hab.</span>
            </div>
          )}
          {accommodation.bathrooms && (
            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-amber-700" />
              <span>{accommodation.bathrooms} baño{accommodation.bathrooms > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Amenities Preview */}
        {accommodation.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {accommodation.amenities.slice(0, 4).map((amenity, i) => (
              <span key={i} className="text-xs bg-stone-100 text-stone-600 px-3 py-1 rounded-full">
                {amenity}
              </span>
            ))}
            {accommodation.amenities.length > 4 && (
              <span className="text-xs bg-stone-100 text-stone-600 px-3 py-1 rounded-full">
                +{accommodation.amenities.length - 4} más
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link to={`${createPageUrl("AccommodationDetail")}?id=${accommodation.id}`} className="flex-1">
            <Button variant="outline" className="w-full border-stone-300 hover:bg-stone-50">
              Ver detalles
            </Button>
          </Link>
          <Link to={`${createPageUrl("AccommodationDetail")}?id=${accommodation.id}`} className="flex-1">
            <Button className="w-full bg-amber-700 hover:bg-amber-800 text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Reservar
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}