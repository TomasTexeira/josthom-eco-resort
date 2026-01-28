import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, User, Mail, Phone, Users, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function BookingForm({ 
  accommodationId,
  accommodationName,
  bookingDetails,
  onSuccess,
  onCancel 
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    number_of_guests: bookingDetails?.guests || 1,
    special_requests: ''
  });
  const [submitted, setSubmitted] = useState(false);

  // Use the total from bookingDetails (already includes discounts)
  const currentTotal = bookingDetails?.total || 0;

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
        // Create booking in Base44
        const booking = await base44.entities.Booking.create(bookingData);

        // Send to Notion with Base44 ID
        try {
          await base44.functions.invoke('sendBookingToNotion', {
            ...bookingData,
            base44_id: booking.id
          });
        } catch (error) {
          console.error('Error enviando a Notion:', error);
          // Continue even if Notion fails - booking is already saved
        }

        return booking;
      },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', accommodationId] });
      setSubmitted(true);
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Add check-in time (14:00 ART) and check-out time (18:00 ART)
    // Argentina timezone offset is UTC-3
    const checkInDate = new Date(bookingDetails.checkIn + 'T14:00:00-03:00');
    const checkOutDate = new Date(bookingDetails.checkOut + 'T18:00:00-03:00');

    const bookingData = {
      accommodation_id: accommodationId,
      accommodation_name: accommodationName,
      check_in: checkInDate.toISOString(),
      check_out: checkOutDate.toISOString(),
      total_price: currentTotal,
      status: 'pending',
      source: 'web',
      ...formData
    };

    createBookingMutation.mutate(bookingData);
  };

  if (submitted) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-light text-stone-800 mb-4">
            ¡Solicitud enviada!
          </h3>
          <p className="text-stone-600 mb-6">
            Recibimos tu solicitud de reserva para <strong>{accommodationName}</strong>.
            Te contactaremos pronto para confirmar la disponibilidad.
          </p>
          <div className="bg-amber-50 rounded-lg p-4 text-sm text-stone-700">
            <p className="mb-2">📧 Te enviaremos un email a <strong>{formData.guest_email}</strong></p>
            <p>📱 También te contactaremos por WhatsApp al {formData.guest_phone}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-stone-50">
        <CardTitle className="text-xl">Completar reserva</CardTitle>
        <p className="text-sm text-stone-500 mt-1">
          {accommodationName} • {bookingDetails.nights} noches
        </p>
      </CardHeader>

      <CardContent className="p-6">
        {/* Booking Summary */}
        <div className="bg-stone-50 rounded-xl p-6 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-stone-600">Check-in</span>
            <span className="font-medium">
              {format(new Date(bookingDetails.checkIn), "dd 'de' MMMM", { locale: es })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-600">Check-out</span>
            <span className="font-medium">
              {format(new Date(bookingDetails.checkOut), "dd 'de' MMMM", { locale: es })}
            </span>
          </div>
          <div className="text-sm text-stone-600 mb-2">
            <span>
              {formData.number_of_guests} {formData.number_of_guests === 1 ? 'huésped' : 'huéspedes'} • {bookingDetails.nights} {bookingDetails.nights === 1 ? 'noche' : 'noches'}
            </span>
          </div>
          <div className="border-t border-stone-200 pt-3 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-amber-700 font-semibold text-lg">
              ${currentTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="guest_name" className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              Nombre completo
            </Label>
            <Input
              id="guest_name"
              required
              value={formData.guest_name}
              onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <Label htmlFor="guest_email" className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="guest_email"
              type="email"
              required
              value={formData.guest_email}
              onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
              placeholder="juan@ejemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="guest_phone" className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4" />
              Teléfono / WhatsApp
            </Label>
            <Input
              id="guest_phone"
              type="tel"
              required
              value={formData.guest_phone}
              onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
              placeholder="+54 9 11 XXXX-XXXX"
            />
          </div>

          <div>
            <Label htmlFor="number_of_guests" className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" />
              Número de huéspedes
            </Label>
            <Input
              id="number_of_guests"
              type="number"
              min="1"
              max="5"
              required
              value={formData.number_of_guests}
              onChange={(e) => setFormData({ ...formData, number_of_guests: parseInt(e.target.value) })}
            />
            <p className="text-xs text-stone-500 mt-1">
              Capacidad máxima: 5 personas • Precio: {(() => {
                const n = formData.number_of_guests;
                if (n <= 2) return '$180.000';
                if (n === 3) return '$240.000';
                if (n === 4) return '$300.000';
                return '$360.000';
              })()} por noche
            </p>
          </div>

          <div>
            <Label htmlFor="special_requests" className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4" />
              Peticiones especiales (opcional)
            </Label>
            <Textarea
              id="special_requests"
              value={formData.special_requests}
              onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              placeholder="Ej: Celebración especial, necesidades dietéticas, hora de llegada estimada..."
              className="min-h-[100px]"
            />
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              Esta es una <strong>solicitud de reserva</strong>. Nos contactaremos contigo 
              para confirmar disponibilidad y coordinar el pago.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={createBookingMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-amber-700 hover:bg-amber-800 text-white"
              disabled={createBookingMutation.isPending}
            >
              {createBookingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar solicitud'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}