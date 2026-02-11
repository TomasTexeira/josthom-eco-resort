import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import SEO from '@/components/shared/SEO';

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const { data: images, isLoading } = useQuery({
    queryKey: ['gallery-images'],
    queryFn: () => base44.entities.GalleryImage.list('order', 50),
    staleTime: 5 * 60 * 1000,
  });

  const { data: gallerySiteContent } = useQuery({
    queryKey: ['siteContent', 'gallery'],
    queryFn: async () => {
      const content = await base44.entities.SiteContent.list();
      return content.find(c => c.section === 'gallery');
    },
    staleTime: 10 * 60 * 1000,
  });

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'campo', label: 'Campo' },
    { id: 'animales', label: 'Animales' },
    { id: 'gastronomía', label: 'Gastronomía' },
    { id: 'paisaje', label: 'Paisaje' },
    { id: 'instalaciones', label: 'Instalaciones' },
  ];

  // Filter valid image formats only (exclude DNG, MP4, etc.)
  const validImages = images?.filter(img => {
    const url = img.image_url?.toLowerCase() || '';
    return url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && !url.includes('.DNG') && !url.includes('.MP4');
  });

  const filteredImages = selectedCategory === 'all' 
    ? validImages 
    : validImages?.filter(img => img.category === selectedCategory);

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextImage = () => setLightboxIndex((prev) => (prev + 1) % filteredImages.length);
  const prevImage = () => setLightboxIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);

  // Default placeholder images if no data
  const placeholderImages = [
    { image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80", title: "Campo abierto", category: "campo" },
    { image_url: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&q=80", title: "Caballos", category: "animales" },
    { image_url: "https://images.unsplash.com/photo-1529040181623-e04ebc611e25?w=800&q=80", title: "Asado", category: "gastronomía" },
    { image_url: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800&q=80", title: "Atardecer", category: "paisaje" },
    { image_url: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80", title: "Cabaña", category: "instalaciones" },
    { image_url: "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&q=80", title: "Pradera", category: "campo" },
  ];

  const displayImages = filteredImages?.length > 0 ? filteredImages : 
    (selectedCategory === 'all' ? placeholderImages : placeholderImages.filter(img => img.category === selectedCategory));

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Galería"
        description="Explora la belleza de Josthom Eco Resort a través de nuestra galería de imágenes. Campo, animales, paisajes, instalaciones y la experiencia de naturaleza en Villa Paranacito."
        keywords="galeria josthom, fotos campo entre rios, imagenes villa paranacito, naturaleza rio uruguay, fotos cabañas"
        url="/gallery"
      />
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[350px] flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src={gallerySiteContent?.image_url || "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80"}
            alt="Galería"
            loading="eager"
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
            Nuestras Imágenes
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white mb-4">
            Galería
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto">
            Descubre la belleza de Josthom a través de nuestra galería
          </p>
        </motion.div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                className={selectedCategory === cat.id 
                  ? "bg-amber-700 hover:bg-amber-800 text-white" 
                  : "border-stone-300 text-stone-600 hover:bg-stone-50"
                }
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayImages?.map((image, index) => (
                <div
                  key={image.id || index}
                  className={`aspect-square rounded-xl overflow-hidden cursor-pointer group ${
                    index % 5 === 0 ? 'md:col-span-2 md:row-span-2' : ''
                  }`}
                  onClick={() => openLightbox(index)}
                >
                  <div className="relative w-full h-full">
                    <img
                      src={image.image_url}
                      alt={image.title || ''}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end">
                      {image.title && (
                        <p className="text-white p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-light">
                          {image.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && displayImages && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button
            onClick={closeLightbox}
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
            src={displayImages[lightboxIndex]?.image_url}
            alt={displayImages[lightboxIndex]?.title || ''}
            className="max-w-full max-h-[90vh] object-contain"
            loading="lazy"
          />

          <button
            onClick={nextImage}
            className="absolute right-6 text-white/80 hover:text-white z-10"
          >
            <ChevronRight className="w-10 h-10" />
          </button>

          <div className="absolute bottom-6 text-center">
            {displayImages[lightboxIndex]?.title && (
              <p className="text-white mb-2">{displayImages[lightboxIndex].title}</p>
            )}
            <p className="text-white/60 text-sm">
              {lightboxIndex + 1} / {displayImages.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}