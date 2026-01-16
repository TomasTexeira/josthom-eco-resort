import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarDays, Users, Info } from 'lucide-react';
import { format, differenceInDays, isWithinInterval, parseISO, addDays } from 'date-fns';
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
  
  // Fetch bookings for this accommodation
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', accommodationId],
    queryFn: () => base44.entities.Booking.filter({ 
      accommodation_id: accommodationId,
      status: { $in: ['pending', 'confirmed'] }
    }),
    enabled: !!accommodationId,
  });

  // Get disabled dates (already booked)
  const getDisabledDates = () => {
    if (!bookings || bookings.length === 0) return [];
    
    const disabledDates = [];
    bookings.forEach(booking => {
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      const days = differenceInDays(checkOut, checkIn);
      
      for (let i = 0; i <= days; i++) {
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

  const calculateTotal = () => {
    const nights = calculateNights();
    return nights * (pricePerNight || 0);
  };

  const isSelectionValid = dateRange.from && dateRange.to && calculateNights() > 0;

  const handleContinueBooking = () => {
    if (onBookingRequest && isSelectionValid) {
      onBookingRequest({
        checkIn: format(dateRange.from, 'yyyy-MM-dd'),
        checkOut: format(dateRange.to, 'yyyy-MM-dd'),
        nights: calculateNights(),
        total: calculateTotal()
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
                <div className="border-t border-amber-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-stone-600">
                      ${pricePerNight?.toLocaleString()} x {calculateNights()} noches
                    </span>
                    <span className="font-medium">
                      ${(pricePerNight * calculateNights()).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-amber-700">
                      ${calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Info Message */}
            {!isSelectionValid && (
              <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  Seleccioná las fechas de check-in y check-out en el calendario. 
                  Las fechas en gris están ocupadas.
                </p>
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