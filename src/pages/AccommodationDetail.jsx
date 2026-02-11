import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Bed, Bath, ExternalLink, Check, 
  ChevronLeft, ChevronRight, X, ArrowLeft, Calendar 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SEO from '@/components/shared/SEO';
import AvailabilityCalendar from '@/components/booking/AvailabilityCalendar';
import BookingForm from '@/components/booking/BookingForm';

export default function AccommodationDetail() {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  const { data: accommodation, isLoading } = useQuery({
    queryKey: ['accommodation', id],
    queryFn: async () => {
      const items = await base44.entities.Accommodation.filter({ id });
      return items[0];
    },
    staleTime: 5 * 60 * 1000,
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

  const handleBookingRequest = (details) => {
    setBookingDetails(details);
    setShowCalendar(false);
    setShowBookingForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    setBookingDetails(null);
    // Could redirect to a confirmation page or show success message
  };

  const handleCancelBooking = () => {
    setShowBookingForm(false);
    setBookingDetails(null);
    setShowCalendar(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate dynamic SEO metadata
  const seoTitle = `${accommodation.name} - ${accommodation.type === 'cabaña' ? 'Cabaña' : 'Casa'} para ${accommodation.capacity} personas`;
  const seoDescription = accommodation.short_description || 
    `${accommodation.name} en Josthom Eco Resort, Villa Paranacito. ${accommodation.type === 'cabaña' ? 'Cabaña' : 'Casa'} con capacidad para ${accommodation.capacity} ${accommodation.capacity === 1 ? 'persona' : 'personas'}${accommodation.bedrooms ? `, ${accommodation.bedrooms} ${accommodation.bedrooms === 1 ? 'habitación' : 'habitaciones'}` : ''}${accommodation.bathrooms ? ` y ${accommodation.bathrooms} ${accommodation.bathrooms === 1 ? 'baño' : 'baños'}` : ''}. ${accommodation.description?.substring(0, 100) || 'Naturaleza, tranquilidad y confort en Entre Ríos.'}`;
  
  const seoKeywords = [
    accommodation.name.toLowerCase(),
    `${accommodation.type} villa paranacito`,
    `alojamiento ${accommodation.capacity} personas entre rios`,
    `cabaña río uruguay`,
    `eco resort entre rios`,
    `naturaleza villa paranacito`,
    ...(accommodation.amenities || []).slice(0, 3)
  ].join(', ');

  // Schema.org structured data for better SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": accommodation.name,
    "description": seoDescription,
    "image": accommodation.main_image,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Villa Paranacito",
      "addressRegion": "Entre Ríos",
      "addressCountry": "AR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -33.7167,
      "longitude": -58.6500
    },
    "amenityFeature": (accommodation.amenities || []).map(amenity => ({
      "@type": "LocationFeatureSpecification",
      "name": amenity
    })),
    "numberOfRooms": accommodation.bedrooms || 1,
    "occupancy": {
      "@type": "QuantitativeValue",
      "maxValue": accommodation.capacity
    },
    "starRating": {
      "@type": "Rating",
      "ratingValue": "4"
    },
    "priceRange": "$$"
  };

  return (
    <div className="min-h-screen bg-white pt-20">
      <SEO 
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={accommodation.main_image}
        url={`/accommodation-detail?id=${accommodation.id}`}
        structuredData={structuredData}
      />
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
              loading="eager"
              width="800"
              height="600"
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
                loading="lazy"
                decoding="async"
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
            <div className="sticky top-28">
              {!showCalendar && !showBookingForm && (
                <div className="bg-stone-50 rounded-3xl p-8 shadow-lg">
                  <div className="mb-6">
                    <div className="mb-2">
                      <span className="text-2xl font-light text-stone-800">
                        $180.000
                      </span>
                      <span className="text-stone-500 ml-2">por noche (hasta 2 personas)</span>
                    </div>
                    <div>
                      <span className="text-2xl font-light text-stone-800">
                        $360.000
                      </span>
                      <span className="text-stone-500 ml-2">por noche (3-5 personas)</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setShowCalendar(true)}
                    className="w-full bg-amber-700 hover:bg-amber-800 text-white py-6 text-lg mb-3"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Ver disponibilidad
                  </Button>

                  {accommodation.booking_url && (
                    <a href={accommodation.booking_url} target="_blank" rel="noopener noreferrer">
                      <Button 
                        variant="outline"
                        className="w-full border-stone-300 py-6 text-base mb-3"
                      >
                        Reservar en plataforma externa
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </a>
                  )}

                  <Link to={createPageUrl("Contact")}>
                    <Button 
                      variant="ghost"
                      className="w-full text-stone-600 hover:text-stone-800"
                    >
                      Contactar por WhatsApp
                    </Button>
                  </Link>

                  <p className="text-center text-sm text-stone-500 mt-4">
                    Reserva directa • Sin intermediarios
                  </p>
                </div>
              )}

              {showCalendar && !showBookingForm && (
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowCalendar(false)}
                    className="mb-4 text-stone-600 hover:text-stone-800"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>
                  <AvailabilityCalendar
                    accommodationId={accommodation.id}
                    accommodationName={accommodation.name}
                    pricePerNight={accommodation.price_per_night}
                    onBookingRequest={handleBookingRequest}
                  />
                </div>
              )}

              {showBookingForm && (
                <div>
                  <Button
                    variant="ghost"
                    onClick={handleCancelBooking}
                    className="mb-4 text-stone-600 hover:text-stone-800"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al calendario
                  </Button>
                  <BookingForm
                    accommodationId={accommodation.id}
                    accommodationName={accommodation.name}
                    bookingDetails={bookingDetails}
                    onSuccess={handleBookingSuccess}
                    onCancel={handleCancelBooking}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
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
            loading="lazy"
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
        </div>
      )}
    </div>
  );
}