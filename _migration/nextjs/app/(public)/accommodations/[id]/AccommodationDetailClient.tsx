"use client";
/**
 * Parte cliente de AccommodationDetail.
 * Migrada desde src/pages/AccommodationDetail.jsx
 * Contiene el calendario de disponibilidad y formulario de reserva (interactivos).
 */
import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { bookingsApi, type Accommodation } from "@/lib/api-client";
import AvailabilityCalendar from "@/components/booking/AvailabilityCalendar";
import BookingForm from "@/components/booking/BookingForm";

interface Props {
  accommodation: Accommodation;
}

export default function AccommodationDetailClient({ accommodation }: Props) {
  const [selectedImage, setSelectedImage] = useState(accommodation.main_image);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [bookingSelection, setBookingSelection] = useState<{
    checkIn: Date;
    checkOut: Date;
    guests: number;
    totalPrice: number;
    depositAmount: number;
  } | null>(null);

  const allImages = [
    ...(accommodation.main_image ? [accommodation.main_image] : []),
    ...accommodation.gallery_images,
  ].filter(Boolean);

  const handleSelectDates = (selection: typeof bookingSelection) => {
    setBookingSelection(selection);
    // Scroll al formulario
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Galería ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Imagen principal */}
          <div
            className="relative h-96 rounded-xl overflow-hidden cursor-pointer"
            onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
          >
            {accommodation.main_image ? (
              <Image
                src={accommodation.main_image}
                alt={accommodation.name}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                priority
              />
            ) : (
              <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-600">
                Sin imagen
              </div>
            )}
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-2 gap-2">
            {allImages.slice(1, 5).map((img, i) => (
              <div
                key={i}
                className="relative h-44 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => { setLightboxIndex(i + 1); setLightboxOpen(true); }}
              >
                <Image
                  src={img}
                  alt={`${accommodation.name} - foto ${i + 2}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Info + Booking ────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Info (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{accommodation.name}</h1>
            <p className="text-gray-500 mt-1">
              {accommodation.capacity} huéspedes · {accommodation.bedrooms} dormitorio{accommodation.bedrooms !== 1 ? "s" : ""} · {accommodation.bathrooms} baño{accommodation.bathrooms !== 1 ? "s" : ""}
            </p>
          </div>

          {accommodation.description && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Descripción</h2>
              <p className="text-gray-600 leading-relaxed">{accommodation.description}</p>
            </div>
          )}

          {accommodation.amenities.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Comodidades</h2>
              <ul className="grid grid-cols-2 gap-2">
                {accommodation.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-2 text-gray-600">
                    <span className="text-green-600">✓</span> {amenity}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Calendario de disponibilidad */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Disponibilidad</h2>
            <AvailabilityCalendar
              accommodationId={accommodation.id}
              onSelectDates={handleSelectDates}
            />
          </div>
        </div>

        {/* Formulario de reserva (1/3) */}
        <div id="booking-form" className="lg:col-span-1">
          <div className="sticky top-24">
            <BookingForm
              accommodation={accommodation}
              selection={bookingSelection}
            />
          </div>
        </div>
      </section>

      {/* Lightbox simplificado - expandir con modal en siguiente iteración */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <Image
            src={allImages[lightboxIndex]}
            alt="Vista ampliada"
            width={1200}
            height={800}
            className="max-h-screen object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl"
            onClick={() => setLightboxOpen(false)}
          >×</button>
        </div>
      )}
    </div>
  );
}
