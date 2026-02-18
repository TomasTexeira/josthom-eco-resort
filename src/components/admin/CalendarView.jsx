import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
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

  // Filtrar reservas por alojamiento
  const filteredBookings = selectedAccommodation === 'all'
    ? bookings
    : bookings.filter(b => b.accommodation_id === selectedAccommodation);

  // Obtener reservas para un día específico
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-full sm:w-auto">
          <Select
            value={selectedAccommodation}
            onValueChange={setSelectedAccommodation}
          >
            <SelectTrigger className="w-full sm:w-[250px]">
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
        <CardContent className="p-4">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-2">
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
                  className={`aspect-square border rounded-lg p-1 ${
                    isToday ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="text-xs font-semibold mb-1 text-center">
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayBookings.slice(0, 2).map((booking) => (
                      <div
                        key={booking.id}
                        className={`text-[10px] px-1 py-0.5 rounded border truncate ${
                          statusColors[booking.status]
                        }`}
                        title={`${booking.accommodation_name} - ${booking.guest_name}`}
                      >
                        {booking.accommodation_name}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="text-[10px] text-gray-500 text-center">
                        +{dayBookings.length - 2} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="mt-6 pt-4 border-t flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>Confirmada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span>Cancelada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span>Completada</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}