"use client";
/**
 * Galería con filtros y lightbox — migrada desde src/pages/Gallery.jsx
 */
import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryImage, SiteContent } from "@/lib/api-client";

const CATEGORIES = [
  { value: "all",           label: "Todas" },
  { value: "campo",         label: "Campo" },
  { value: "animales",      label: "Animales" },
  { value: "gastronomía",   label: "Gastronomía" },
  { value: "paisaje",       label: "Paisaje" },
  { value: "instalaciones", label: "Instalaciones" },
];

const VALID_IMAGE_EXTS = /\.(jpe?g|png|webp|gif|avif)$/i;

interface Props {
  initialImages: GalleryImage[];
  heroContent: SiteContent | null;
}

export default function GalleryClient({ initialImages, heroContent }: Props) {
  const [category, setCategory] = useState("all");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Filtrar formatos no-imagen (como en el original)
  const validImages = initialImages.filter(
    (img) => !img.image_url || VALID_IMAGE_EXTS.test(img.image_url)
  );

  const filtered =
    category === "all" ? validImages : validImages.filter((img) => img.category === category);

  const openLightbox = (i: number) => setLightboxIdx(i);
  const closeLightbox = () => setLightboxIdx(null);
  const prev = () => setLightboxIdx((i) => (i !== null ? (i - 1 + filtered.length) % filtered.length : null));
  const next = () => setLightboxIdx((i) => (i !== null ? (i + 1) % filtered.length : null));

  return (
    <>
      {/* Hero */}
      <section className="relative h-64 flex items-center justify-center bg-green-900">
        {heroContent?.image_url && (
          <Image src={heroContent.image_url} alt="Galería" fill className="object-cover opacity-40" priority />
        )}
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl font-bold">{heroContent?.title || "Galería"}</h1>
          {heroContent?.subtitle && <p className="mt-2 text-white/80">{heroContent.subtitle}</p>}
        </div>
      </section>

      {/* Filtros */}
      <div className="section-container pt-10 pb-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === cat.value
                  ? "bg-green-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid masonry */}
      <section className="section-container py-8">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-20">No hay imágenes en esta categoría.</p>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {filtered.map((img, i) => (
              <div
                key={img.id}
                className="break-inside-avoid cursor-pointer overflow-hidden rounded-xl group relative"
                onClick={() => openLightbox(i)}
              >
                <Image
                  src={img.image_url}
                  alt={img.title || `Foto ${i + 1}`}
                  width={600}
                  height={400}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-400"
                />
                {img.title && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-3">
                    <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {img.title}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={closeLightbox}
          >
            <X size={28} />
          </button>
          <button
            className="absolute left-4 text-white/80 hover:text-white p-3"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft size={36} />
          </button>
          <Image
            src={filtered[lightboxIdx].image_url}
            alt={filtered[lightboxIdx].title || "Foto"}
            width={1200}
            height={800}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 text-white/80 hover:text-white p-3"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight size={36} />
          </button>
          <div className="absolute bottom-4 text-white/60 text-sm">
            {lightboxIdx + 1} / {filtered.length}
          </div>
        </div>
      )}
    </>
  );
}
