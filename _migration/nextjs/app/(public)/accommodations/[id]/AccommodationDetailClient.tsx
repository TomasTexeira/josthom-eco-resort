"use client";
import { useState } from "react";
import Image from "next/image";
import { Users, BedDouble, Bath, X } from "lucide-react";
import { type Accommodation } from "@/lib/api-client";
import AvailabilityCalendar from "@/components/booking/AvailabilityCalendar";
import BookingForm from "@/components/booking/BookingForm";

interface Props {
  accommodation: Accommodation;
}

export default function AccommodationDetailClient({ accommodation }: Props) {
  const [lightboxOpen, setLightboxOpen]   = useState(false);
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
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── Galería ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Imagen principal */}
          <div
            className="relative h-96 rounded-2xl overflow-hidden cursor-zoom-in shadow-sm"
            onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
          >
            {accommodation.main_image ? (
              <Image
                src={accommodation.main_image}
                alt={accommodation.name}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
                priority
              />
            ) : (
              <div className="w-full h-full bg-brand-50 flex items-center justify-center text-brand-600 text-sm">
                Sin imagen
              </div>
            )}
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-2 gap-2">
            {allImages.slice(1, 5).map((img, i) => (
              <div
                key={i}
                className="relative h-44 rounded-xl overflow-hidden cursor-zoom-in"
                onClick={() => { setLightboxIndex(i + 1); setLightboxOpen(true); }}
              >
                <Image
                  src={img}
                  alt={`${accommodation.name} — foto ${i + 2}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Info + Booking ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Info (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Título */}
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900">
              {accommodation.name}
            </h1>
            <div className="flex items-center gap-5 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Users size={15} className="text-brand-600" /> {accommodation.capacity} huéspedes</span>
              <span className="flex items-center gap-1.5"><BedDouble size={15} className="text-brand-600" /> {accommodation.bedrooms} dorm.</span>
              <span className="flex items-center gap-1.5"><Bath size={15} className="text-brand-600" /> {accommodation.bathrooms} baño{accommodation.bathrooms !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Descripción */}
          {accommodation.description && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h2>
              <p className="text-gray-600 leading-relaxed">{accommodation.description}</p>
            </div>
          )}

          {/* Comodidades */}
          {accommodation.amenities.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Comodidades</h2>
              <ul className="grid grid-cols-2 gap-2.5">
                {accommodation.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-brand-600 font-bold">✓</span> {amenity}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disponibilidad */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Disponibilidad</h2>
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

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2"
            onClick={() => setLightboxOpen(false)}
          >
            <X size={28} />
          </button>
          <Image
            src={allImages[lightboxIndex]}
            alt="Vista ampliada"
            width={1200}
            height={800}
            className="max-h-screen object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
