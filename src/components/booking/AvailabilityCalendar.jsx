import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarDays, Users, Info } from 'lucide-react';
import { format, differenceInDays, isWithinInterval, parseISO, addDays, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AvailabilityCalendar({ 
  accommodationId, 
  accommodationName,
  pricePerNight,
  onBookingRequest 
}) {
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [numberOfGuests, setNumberOfGuests] = useState(2);
  
  // Fetch bookings for this accommodation
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', accommodationId],
    queryFn: () => base44.entities.Booking.filter({ 
      accommodation_id: accommodationId,
      status: { $in: ['pending', 'confirmed'] }
    }),
    enabled: !!accommodationId,
  });

  // Get disabled dates (already booked + 1 night buffer)
  const getDisabledDates = () => {
    if (!bookings || bookings.length === 0) return [];
    
    const disabledDates = [];
    bookings.forEach(booking => {
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      const days = differenceInDays(checkOut, checkIn);
      
      // Include booking dates + 1 night buffer after checkout
      for (let i = 0; i <= days + 1; i++) {
        disabledDates.push(addDays(checkIn, i));
      }
    });
    
    return disabledDates;
  };

  const disabledDates = getDisabledDates();

  // Check if selected range overlaps with any booking
  const isRangeAvailable = (range) => {
    if (!range.from || !range.to || !bookings) return true;
    
    return !bookings.some(booking => {
      const bookingStart = parseISO(booking.check_in);
      const bookingEnd = parseISO(booking.check_out);
      
      // Check if there's any overlap
      return (
        (range.from >= bookingStart && range.from <= bookingEnd) ||
        (range.to >= bookingStart && range.to <= bookingEnd) ||
        (range.from <= bookingStart && range.to >= bookingEnd)
      );
    });
  };

  const handleSelect = (range) => {
    if (!range) {
      setDateRange({ from: null, to: null });
      return;
    }

    // If selecting a single date or completing a range
    if (range.from && range.to) {
      // Check if range is available
      if (isRangeAvailable(range)) {
        setDateRange(range);
      } else {
        // Reset if range overlaps with a booking
        setDateRange({ from: range.from, to: null });
      }
    } else {
      setDateRange(range);
    }
  };

  const calculateNights = () => {
    if (!dateRange.from || !dateRange.to) return 0;
    return differenceInDays(dateRange.to, dateRange.from);
  };

  const getPricePerNight = (numGuests) => {
    if (numGuests <= 2) return 180000;
    if (numGuests === 3) return 240000;
    if (numGuests === 4) return 300000;
    return 360000; // 5 personas
  };

  const hasWeekdayDiscount = () => {
    if (!dateRange.from || !dateRange.to) return false;
    const nights = calculateNights();
    let weekdayNights = 0;
    
    for (let i = 0; i < nights; i++) {
      const day = getDay(addDays(dateRange.from, i));
      // Monday = 1, Thursday = 4
      if (day >= 1 && day <= 4) weekdayNights++;
    }
    
    return weekdayNights > 0 ? weekdayNights : 0;
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    const basePrice = getPricePerNight(numberOfGuests);
    const weekdayNights = hasWeekdayDiscount();
    const weekendNights = nights - weekdayNights;
    
    const weekdayTotal = weekdayNights * basePrice * 0.85; // 15% descuento
    const weekendTotal = weekendNights * basePrice;
    
    return Math.round(weekdayTotal + weekendTotal);
  };

  const isSelectionValid = dateRange.from && dateRange.to && calculateNights() >= 2;

  const handleContinueBooking = () => {
    if (onBookingRequest && isSelectionValid) {
      onBookingRequest({
        checkIn: format(dateRange.from, 'yyyy-MM-dd'),
        checkOut: format(dateRange.to, 'yyyy-MM-dd'),
        nights: calculateNights(),
        total: calculateTotal(),
        guests: numberOfGuests
      });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-stone-50">
        <CardTitle className="flex items-center gap-2 text-xl">
          <CalendarDays className="w-5 h-5 text-amber-700" />
          Seleccionar fechas
        </CardTitle>
        {accommodationName && (
          <p className="text-sm text-stone-500 mt-1">{accommodationName}</p>
        )}
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-700" />
          </div>
        ) : (
          <>
            {/* Number of Guests Selector */}
            <div className="mb-6 bg-stone-50 rounded-lg p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-3">
                <Users className="w-4 h-4" />
                Número de huéspedes
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumberOfGuests(num)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      numberOfGuests === num
                        ? 'bg-amber-700 text-white'
                        : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-500 mt-2">
                Precio por noche: ${getPricePerNight(numberOfGuests).toLocaleString()}
              </p>
            </div>

            <div className="flex justify-center mb-4">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleSelect}
                numberOfMonths={2}
                disabled={[
                  { before: new Date() },
                  ...disabledDates
                ]}
                locale={es}
                className="rounded-lg"
              />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center text-sm text-stone-600 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-100 border border-amber-300 rounded"></div>
                <span>Seleccionado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-stone-200 rounded"></div>
                <span>No disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-stone-300 rounded"></div>
                <span>Disponible</span>
              </div>
            </div>

            {/* Selection Summary */}
            {isSelectionValid && (
              <div className="bg-amber-50 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-stone-600">Check-in</span>
                  <span className="font-medium">
                    {format(dateRange.from, "dd 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-600">Check-out</span>
                  <span className="font-medium">
                    {format(dateRange.to, "dd 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
                <div className="border-t border-amber-200 pt-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-600">{numberOfGuests} {numberOfGuests === 1 ? 'huésped' : 'huéspedes'}</span>
                    <span className="font-medium">${getPricePerNight(numberOfGuests).toLocaleString()}/noche</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-600">{calculateNights()} noches</span>
                    <span className="font-medium">
                      ${(getPricePerNight(numberOfGuests) * calculateNights()).toLocaleString()}
                    </span>
                  </div>
                  {hasWeekdayDiscount() > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-700">
                      <span>Descuento lunes-jueves (15%)</span>
                      <span>-${Math.round(getPricePerNight(numberOfGuests) * hasWeekdayDiscount() * 0.15).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-semibold border-t border-amber-200 pt-2">
                    <span>Total</span>
                    <span className="text-amber-700">
                      ${calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Info Message */}
            {!isSelectionValid && dateRange.from && dateRange.to && calculateNights() < 2 && (
              <div className="flex items-start gap-3 bg-amber-50 rounded-lg p-4 text-sm text-amber-800">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  La estadía mínima es de 2 noches.
                </p>
              </div>
            )}
            {!isSelectionValid && (!dateRange.from || !dateRange.to) && (
              <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="mb-2">
                    Seleccioná las fechas de check-in y check-out en el calendario (mínimo 2 noches).
                  </p>
                  <p className="text-xs">
                    • Descuento del 15% de lunes a jueves<br />
                    • Las fechas en gris incluyen 1 noche de limpieza entre reservas
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {isSelectionValid && (
        <CardFooter className="border-t bg-stone-50 p-6">
          <Button 
            onClick={handleContinueBooking}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white py-6 text-lg"
          >
            Continuar con la reserva
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}