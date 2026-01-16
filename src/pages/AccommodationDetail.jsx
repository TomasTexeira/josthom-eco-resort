import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Bed, Bath, ExternalLink, Check, 
  ChevronLeft, ChevronRight, X, ArrowLeft 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AccommodationDetail() {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  const { data: accommodation, isLoading } = useQuery({
    queryKey: ['accommodation', id],
    queryFn: async () => {
      const items = await base44.entities.Accommodation.filter({ id });
      return items[0];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!accommodation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500 mb-4">Alojamiento no encontrado</p>
          <Link to={createPageUrl("Accommodations")}>
            <Button variant="outline">Ver alojamientos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const allImages = [accommodation.main_image, ...(accommodation.gallery_images || [])].filter(Boolean);

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Link to={createPageUrl("Accommodations")} className="inline-flex items-center text-stone-600 hover:text-amber-700 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a alojamientos
        </Link>
      </div>

      {/* Gallery */}
      <section className="max-w-7xl mx-auto px-6 mb-12">
        <div className="grid grid-cols-4 gap-4">
          {/* Main Image */}
          <div 
            className="col-span-4 md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto rounded-2xl overflow-hidden cursor-pointer"
            onClick={() => setSelectedImageIndex(0)}
          >
            <img
              src={accommodation.main_image || "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80"}
              alt={accommodation.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
          
          {/* Gallery Thumbnails */}
          {(accommodation.gallery_images || []).slice(0, 4).map((img, i) => (
            <div 
              key={i}
              className="aspect-square rounded-xl overflow-hidden cursor-pointer hidden md:block"
              onClick={() => setSelectedImageIndex(i + 1)}
            >
              <img
                src={img}
                alt={`${accommodation.name} ${i + 2}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-amber-100 text-amber-800 capitalize">
                {accommodation.type}
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-light text-stone-800 mb-6">
              {accommodation.name}
            </h1>

            {/* Quick Info */}
            <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-stone-200">
              <div className="flex items-center gap-2 text-stone-600">
                <Users className="w-5 h-5 text-amber-700" />
                <span>{accommodation.capacity} huéspedes</span>
              </div>
              {accommodation.bedrooms && (
                <div className="flex items-center gap-2 text-stone-600">
                  <Bed className="w-5 h-5 text-amber-700" />
                  <span>{accommodation.bedrooms} habitaciones</span>
                </div>
              )}
              {accommodation.bathrooms && (
                <div className="flex items-center gap-2 text-stone-600">
                  <Bath className="w-5 h-5 text-amber-700" />
                  <span>{accommodation.bathrooms} baños</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-10">
              <h2 className="text-2xl font-light text-stone-800 mb-4">Sobre este espacio</h2>
              <p className="text-stone-600 leading-relaxed whitespace-pre-line">
                {accommodation.description}
              </p>
            </div>

            {/* Amenities */}
            {accommodation.amenities?.length > 0 && (
              <div>
                <h2 className="text-2xl font-light text-stone-800 mb-6">Comodidades</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {accommodation.amenities.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-3 text-stone-600">
                      <Check className="w-5 h-5 text-amber-700 flex-shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-stone-50 rounded-3xl p-8">
              {accommodation.price_per_night && (
                <div className="mb-6">
                  <span className="text-3xl font-light text-stone-800">
                    ${accommodation.price_per_night.toLocaleString()}
                  </span>
                  <span className="text-stone-500 ml-2">por noche</span>
                </div>
              )}

              {accommodation.booking_url ? (
                <a href={accommodation.booking_url} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-amber-700 hover:bg-amber-800 text-white py-6 text-lg mb-4">
                    Reservar ahora
                    <ExternalLink className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              ) : (
                <Link to={createPageUrl("Contact")}>
                  <Button className="w-full bg-amber-700 hover:bg-amber-800 text-white py-6 text-lg mb-4">
                    Consultar disponibilidad
                  </Button>
                </Link>
              )}

              <p className="text-center text-sm text-stone-500">
                Reserva directa • Sin intermediarios
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          >
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-6 right-6 text-white/80 hover:text-white z-10"
            >
              <X className="w-8 h-8" />
            </button>

            <button
              onClick={prevImage}
              className="absolute left-6 text-white/80 hover:text-white z-10"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>

            <img
              src={allImages[selectedImageIndex]}
              alt=""
              className="max-w-full max-h-[90vh] object-contain"
            />

            <button
              onClick={nextImage}
              className="absolute right-6 text-white/80 hover:text-white z-10"
            >
              <ChevronRight className="w-10 h-10" />
            </button>

            <div className="absolute bottom-6 text-white/60 text-sm">
              {selectedImageIndex + 1} / {allImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}