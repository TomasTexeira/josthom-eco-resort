import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Calendar as CalendarIcon, User, Phone, Mail, Home, AlertCircle } from 'lucide-react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';

export default function BookingsManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAccommodation, setFilterAccommodation] = useState('all');
  const queryClient = useQueryClient();

  const { data: rawBookings, isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const result = await base44.entities.Booking.list();
      return Array.isArray(result) ? result : (result?.items || []);
    },
  });

  const { data: rawAccommodations } = useQuery({
    queryKey: ['accommodations-list'],
    queryFn: async () => {
      const result = await base44.entities.Accommodation.list();
      return Array.isArray(result) ? result : (result?.items || []);
    },
  });

  const bookings = rawBookings || [];
  const accommodations = rawAccommodations || [];

  // Calcular precio automático según reglas
  const calculateAutoPrice = (checkIn, checkOut, numGuests) => {
    if (!checkIn || !checkOut || !numGuests) return 0;
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    
    if (nights < 1) return 0;
    
    // Precio base según huéspedes
    let pricePerNight = 180000;
    if (numGuests === 3) pricePerNight = 240000;
    else if (numGuests === 4) pricePerNight = 300000;
    else if (numGuests >= 5) pricePerNight = 360000;
    
    // Calcular noches entre lunes y jueves (descuento 15%)
    let total = 0;
    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + i);
      const dayOfWeek = currentDate.getDay();
      
      // Lunes=1, Martes=2, Miércoles=3, Jueves=4
      if (dayOfWeek >= 1 && dayOfWeek <= 4) {
        total += pricePerNight * 0.85; // 15% descuento
      } else {
        total += pricePerNight;
      }
    }
    
    return Math.round(total);
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] }); // Invalidar calendarios de clientes
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
      setIsDialogOpen(false);
      setEditingBooking(null);
      resetForm();
    },
  });

  // Actualización rápida de estado
  const quickUpdateMutation = useMutation({
    mutationFn: ({ id, field, value }) => {
      const updateData = { [field]: value };
      
      // Si se cambia payment_status a paid, confirmar la reserva automáticamente
      if (field === 'payment_status' && value === 'paid') {
        updateData.status = 'confirmed';
      }
      // Si se cambia payment_status a pending, poner reserva en pending
      if (field === 'payment_status' && value === 'pending') {
        updateData.status = 'pending';
      }
      
      return base44.entities.Booking.update(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] }); // Invalidar calendarios de clientes
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Booking.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] }); // Invalidar calendarios de clientes
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
    },
  });

  const [formData, setFormData] = useState({
    accommodation_id: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    number_of_guests: 2,
    check_in: '',
    check_out: '',
    status: 'pending',
    payment_status: 'pending',
    balance_status: 'pending',
    total_price: 0,
    special_requests: '',
    source: 'web',
  });

  const resetForm = () => {
    setFormData({
      accommodation_id: '',
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      number_of_guests: 2,
      check_in: '',
      check_out: '',
      status: 'pending',
      payment_status: 'pending',
      balance_status: 'pending',
      total_price: 0,
      special_requests: '',
      source: 'web',
    });
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setFormData({
      accommodation_id: booking.accommodation_id,
      guest_name: booking.guest_name || '',
      guest_email: booking.guest_email || '',
      guest_phone: booking.guest_phone || '',
      number_of_guests: booking.number_of_guests || 2,
      check_in: booking.check_in?.split('T')[0] || '',
      check_out: booking.check_out?.split('T')[0] || '',
      status: booking.status,
      payment_status: booking.payment_status || 'pending',
      balance_status: booking.balance_status || 'pending',
      total_price: booking.total_price || 0,
      special_requests: booking.special_requests || '',
      source: booking.source || 'web',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const accommodation = accommodations.find(a => a.id === formData.accommodation_id);
    
    // Validar que las fechas no estén ocupadas
    const checkIn = new Date(`${formData.check_in}T14:00:00-03:00`);
    const checkOut = new Date(`${formData.check_out}T18:00:00-03:00`);
    
    const hasConflict = bookings.some(booking => {
      // Ignorar la reserva actual si estamos editando
      if (editingBooking && booking.id === editingBooking.id) return false;
      
      // Solo verificar reservas del mismo alojamiento
      if (booking.accommodation_id !== formData.accommodation_id) return false;
      
      // Ignorar reservas canceladas
      if (booking.status === 'cancelled') return false;
      
      const existingCheckIn = new Date(booking.check_in);
      const existingCheckOut = new Date(booking.check_out);
      
      // Verificar solapamiento
      return (checkIn < existingCheckOut && checkOut > existingCheckIn);
    });
    
    if (hasConflict) {
      alert('Las fechas seleccionadas se solapan con una reserva existente para este alojamiento.');
      return;
    }
    
    const bookingData = {
      ...formData,
      accommodation_name: accommodation?.name || '',
      check_in: checkIn.toISOString(),
      check_out: checkOut.toISOString(),
      // Sincronizar status con payment_status
      status: formData.payment_status === 'paid' ? 'confirmed' : 'pending',
    };

    if (editingBooking) {
      updateMutation.mutate({ id: editingBooking.id, data: bookingData });
    } else {
      createMutation.mutate(bookingData);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
  };

  const statusLabels = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada',
  };

  const filteredBookings = bookings
    .filter(b => filterStatus === 'all' || b.status === filterStatus)
    .filter(b => filterAccommodation === 'all' || b.accommodation_id === filterAccommodation);

  if (isLoading) {
    return <div className="flex justify-center py-12">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            size="sm"
          >
            Todas
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pending')}
            size="sm"
          >
            Pendientes
          </Button>
          <Button
            variant={filterStatus === 'confirmed' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('confirmed')}
            size="sm"
          >
            Confirmadas
          </Button>
          
          <Select value={filterAccommodation} onValueChange={setFilterAccommodation}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="Filtrar por cabaña" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las cabañas</SelectItem>
              {accommodations.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingBooking(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Reserva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBooking ? 'Editar Reserva' : 'Nueva Reserva'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Alojamiento</Label>
                  <Select
                    value={formData.accommodation_id}
                    onValueChange={(value) => setFormData({ ...formData, accommodation_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar alojamiento" />
                    </SelectTrigger>
                    <SelectContent>
                      {accommodations.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Nombre del huésped</Label>
                  <Input
                    value={formData.guest_name}
                    onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.guest_email}
                    onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                    placeholder="email@ejemplo.com"
                  />
                </div>

                <div>
                  <Label>Teléfono / WhatsApp</Label>
                  <Input
                    value={formData.guest_phone}
                    onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                    placeholder="+54 9 11..."
                  />
                </div>

                <div>
                  <Label>Cant. huéspedes</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.number_of_guests}
                    onChange={(e) => {
                      const newGuests = parseInt(e.target.value);
                      setFormData(prev => {
                        const updated = { ...prev, number_of_guests: newGuests };
                        updated.total_price = calculateAutoPrice(prev.check_in, prev.check_out, newGuests);
                        return updated;
                      });
                    }}
                  />
                </div>

                {/* Mostrar calendario si hay alojamiento seleccionado */}
                {formData.accommodation_id && (
                  <div className="col-span-2">
                    <Label className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="w-4 h-4" />
                      Fechas disponibles para {accommodations.find(a => a.id === formData.accommodation_id)?.name}
                    </Label>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <Calendar
                        mode="range"
                        selected={{
                          from: formData.check_in ? new Date(formData.check_in + 'T00:00:00') : undefined,
                          to: formData.check_out ? new Date(formData.check_out + 'T00:00:00') : undefined,
                        }}
                        onSelect={(range) => {
                          if (range?.from) {
                            const checkInStr = format(range.from, 'yyyy-MM-dd');
                            setFormData(prev => {
                              const updated = { ...prev, check_in: checkInStr };
                              if (range?.to) {
                                const checkOutStr = format(range.to, 'yyyy-MM-dd');
                                updated.check_out = checkOutStr;
                                updated.total_price = calculateAutoPrice(checkInStr, checkOutStr, prev.number_of_guests);
                              }
                              return updated;
                            });
                          }
                        }}
                        disabled={[
                          { before: new Date() },
                          ...(bookings || [])
                            .filter(b => 
                              b.accommodation_id === formData.accommodation_id && 
                              b.status !== 'cancelled' &&
                              (!editingBooking || b.id !== editingBooking.id)
                            )
                            .flatMap(booking => {
                              const checkIn = parseISO(booking.check_in);
                              const checkOut = parseISO(booking.check_out);
                              const days = differenceInDays(checkOut, checkIn);
                              const dates = [];
                              for (let i = 0; i <= days + 1; i++) {
                                dates.push(addDays(checkIn, i));
                              }
                              return dates;
                            })
                        ]}
                        locale={es}
                        numberOfMonths={2}
                        className="flex justify-center"
                      />
                      <div className="flex gap-4 mt-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-gray-200 rounded"></div>
                          <span>Ocupado</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-600 rounded"></div>
                          <span>Seleccionado</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Check-In</Label>
                  <Input
                    type="date"
                    value={formData.check_in}
                    onChange={(e) => {
                      const newCheckIn = e.target.value;
                      setFormData(prev => {
                        const updated = { ...prev, check_in: newCheckIn };
                        updated.total_price = calculateAutoPrice(newCheckIn, prev.check_out, prev.number_of_guests);
                        return updated;
                      });
                    }}
                    required
                  />
                  {formData.accommodation_id && formData.check_in && (
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(formData.check_in + 'T00:00:00'), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Check-Out</Label>
                  <Input
                    type="date"
                    value={formData.check_out}
                    onChange={(e) => {
                      const newCheckOut = e.target.value;
                      setFormData(prev => {
                        const updated = { ...prev, check_out: newCheckOut };
                        updated.total_price = calculateAutoPrice(prev.check_in, newCheckOut, prev.number_of_guests);
                        return updated;
                      });
                    }}
                    required
                  />
                  {formData.accommodation_id && formData.check_out && (
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(formData.check_out + 'T00:00:00'), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Estado de la reserva</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Estado del pago (reserva)</Label>
                  <Select
                    value={formData.payment_status}
                    onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="paid">Pagado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Estado del saldo</Label>
                  <Select
                    value={formData.balance_status}
                    onValueChange={(value) => setFormData({ ...formData, balance_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="paid">Pagado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Monto total (calculado automáticamente)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.total_price}
                    onChange={(e) => setFormData({ ...formData, total_price: parseFloat(e.target.value) })}
                    placeholder="0"
                    className="bg-gray-50"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se calcula según fechas y cantidad de huéspedes
                  </p>
                </div>

                <div>
                  <Label>Fuente</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => setFormData({ ...formData, source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">Web</SelectItem>
                      <SelectItem value="airbnb">Airbnb</SelectItem>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="phone">Teléfono</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Notas / Solicitudes especiales</Label>
                  <Textarea
                    value={formData.special_requests}
                    onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                    placeholder="Notas adicionales..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingBooking(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingBooking ? 'Guardar Cambios' : 'Crear Reserva'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {filteredBookings.map((booking) => (
          <Card key={booking.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Home className="w-4 h-4 text-gray-500" />
                    <CardTitle className="text-lg">
                      {booking.accommodation_name || 'Sin alojamiento'}
                    </CardTitle>
                    <Badge className={statusColors[booking.status]}>
                      {statusLabels[booking.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {booking.guest_name || 'Sin nombre'}
                    </div>
                    {booking.guest_email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {booking.guest_email}
                      </div>
                    )}
                    {booking.guest_phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {booking.guest_phone}
                      </div>
                    )}
                  </div>

                  {/* Selectores rápidos */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div>
                      <Label className="text-xs text-gray-500">Estado reserva</Label>
                      <Select
                        value={booking.status}
                        onValueChange={(value) => quickUpdateMutation.mutate({ id: booking.id, field: 'status', value })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="confirmed">Confirmada</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                          <SelectItem value="completed">Completada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Pago reserva</Label>
                      <Select
                        value={booking.payment_status || 'pending'}
                        onValueChange={(value) => quickUpdateMutation.mutate({ id: booking.id, field: 'payment_status', value })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="paid">Pagado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Estado saldo</Label>
                      <Select
                        value={booking.balance_status || 'pending'}
                        onValueChange={(value) => quickUpdateMutation.mutate({ id: booking.id, field: 'balance_status', value })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="paid">Pagado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(booking)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      if (confirm('¿Eliminar esta reserva?')) {
                        deleteMutation.mutate(booking.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const checkIn = new Date(booking.check_in);
                const checkOut = new Date(booking.check_out);
                const nights = Math.floor((checkOut - checkIn) / (1000 * 60 * 60 * 24));

                // Calcular noches con descuento
                let discountedNights = 0;
                for (let i = 0; i < nights; i++) {
                  const currentDate = new Date(checkIn);
                  currentDate.setDate(currentDate.getDate() + i);
                  const dayOfWeek = currentDate.getDay();
                  if (dayOfWeek >= 1 && dayOfWeek <= 4) {
                    discountedNights++;
                  }
                }

                const depositAmount = Math.round((booking.total_price || 0) * 0.25);
                const balanceAmount = (booking.total_price || 0) - depositAmount;

                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <div className="text-gray-500 mb-1">Check-In</div>
                        <div className="font-medium">
                          {booking.check_in ? format(checkIn, "d 'de' MMMM", { locale: es }) : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Check-Out</div>
                        <div className="font-medium">
                          {booking.check_out ? format(checkOut, "d 'de' MMMM", { locale: es }) : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Huéspedes</div>
                        <div className="font-medium">{booking.number_of_guests || '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Cantidad de noches</div>
                        <div className="font-medium">{nights} noches</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <div className="text-gray-500 mb-1">Noches con 15% off</div>
                        <div className="font-medium text-green-600">{discountedNights} noches</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Monto Total</div>
                        <div className="font-medium text-lg">${(booking.total_price || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Reserva (25%)</div>
                        <div className="font-medium">${depositAmount.toLocaleString()}</div>
                        <Badge className={booking.payment_status === 'paid' ? 'bg-green-100 text-green-800 mt-1' : 'bg-yellow-100 text-yellow-800 mt-1'}>
                          {booking.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Saldo Pendiente</div>
                        <div className="font-medium">${balanceAmount.toLocaleString()}</div>
                        <Badge className={booking.balance_status === 'paid' ? 'bg-green-100 text-green-800 mt-1' : 'bg-yellow-100 text-yellow-800 mt-1'}>
                          {booking.balance_status === 'paid' ? 'Pagado' : 'Pendiente'}
                        </Badge>
                      </div>
                    </div>
                  </>
                );
              })()}

              {booking.special_requests && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-gray-500 text-sm mb-1">Notas</div>
                  <div className="text-sm">{booking.special_requests}</div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredBookings.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No hay reservas {filterStatus !== 'all' && statusLabels[filterStatus].toLowerCase()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}