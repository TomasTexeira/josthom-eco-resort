import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAccommodation, setSelectedAccommodation] = useState('all');
  const [hoveredBooking, setHoveredBooking] = useState(null);

  const { data: rawBookings } = useQuery({
    queryKey: ['calendar-bookings'],
    queryFn: async () => {
      const result = await base44.entities.Booking.list();
      return Array.isArray(result) ? result : (result?.items || []);
    },
  });

  const { data: rawAccommodations } = useQuery({
    queryKey: ['calendar-accommodations'],
    queryFn: async () => {
      const result = await base44.entities.Accommodation.list();
      return Array.isArray(result) ? result : (result?.items || []);
    },
  });

  const bookings = rawBookings || [];
  const accommodations = rawAccommodations || [];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Filtrar reservas por alojamiento y por mes actual
  const filteredBookings = bookings.filter(b => {
    const checkIn = new Date(b.check_in);
    const checkOut = new Date(b.check_out);
    const inCurrentMonth = (checkIn <= monthEnd && checkOut >= monthStart);
    const matchesAccommodation = selectedAccommodation === 'all' || b.accommodation_id === selectedAccommodation;
    return inCurrentMonth && matchesAccommodation;
  });

  const getBookingsForDay = (day) => {
    return filteredBookings.filter(booking => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      return day >= checkIn && day < checkOut;
    });
  };

  const statusColors = {
    pending: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    confirmed: 'bg-green-100 border-green-300 text-green-800',
    cancelled: 'bg-red-100 border-red-300 text-red-800',
    completed: 'bg-blue-100 border-blue-300 text-blue-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg sm:text-xl font-semibold min-w-[180px] text-center">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="hidden sm:flex"
          >
            Hoy
          </Button>
        </div>

        <div className="w-full sm:w-auto">
          <Select
            value={selectedAccommodation}
            onValueChange={setSelectedAccommodation}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Filtrar por alojamiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los alojamientos</SelectItem>
              {accommodations.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-2 sm:p-4">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, i) => (
              <div key={day} className="text-center font-semibold text-xs sm:text-sm text-gray-600 py-2">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{['D', 'L', 'M', 'M', 'J', 'V', 'S'][i]}</span>
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Espacios vacíos antes del primer día */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Días del mes */}
            {daysInMonth.map((day) => {
              const dayBookings = getBookingsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toString()}
                  className={`aspect-square border rounded-lg p-0.5 sm:p-1 ${
                    isToday ? 'border-2 border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className={`text-[10px] sm:text-xs font-semibold mb-0.5 sm:mb-1 text-center ${
                    isToday ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 2).map((booking) => (
                      <div
                        key={booking.id}
                        className={`text-[8px] sm:text-[10px] px-0.5 sm:px-1 py-0.5 rounded border truncate cursor-pointer transition-all ${
                          statusColors[booking.status]
                        } ${hoveredBooking === booking.id ? 'ring-2 ring-blue-400 scale-105 z-10' : 'hover:opacity-80'}`}
                        onMouseEnter={() => setHoveredBooking(booking.id)}
                        onMouseLeave={() => setHoveredBooking(null)}
                        title={`${booking.guest_name || 'Sin nombre'} - ${booking.accommodation_name}\n${format(new Date(booking.check_in), "d MMM", { locale: es })} → ${format(new Date(booking.check_out), "d MMM", { locale: es })}`}
                      >
                        <div className="truncate font-medium">{booking.guest_name || 'Sin nombre'}</div>
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="text-[8px] sm:text-[10px] text-gray-500 text-center font-medium">
                        +{dayBookings.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leyenda y Estadísticas */}
          <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span>Pendiente</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 border border-green-300 rounded"></div>
                <span>Confirmada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-50 border-2 border-blue-500 rounded"></div>
                <span>Hoy</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-700">
              <div>
                <span className="font-semibold text-base sm:text-lg text-gray-900">{filteredBookings.length}</span> reservas
              </div>
              <div>
                <span className="font-semibold text-base sm:text-lg text-green-700">{filteredBookings.filter(b => b.status === 'confirmed').length}</span> confirmadas
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}