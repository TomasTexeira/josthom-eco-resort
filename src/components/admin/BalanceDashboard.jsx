import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BalanceDashboard() {
  const { data: rawBookings, isLoading } = useQuery({
    queryKey: ['bookings-balance'],
    queryFn: async () => {
      const result = await base44.entities.Booking.list();
      return Array.isArray(result) ? result : (result?.items || []);
    },
  });

  const bookings = rawBookings || [];

  // Filtrar solo reservas activas (no canceladas ni completadas)
  const activeBookings = bookings.filter(b => 
    b.status !== 'cancelled' && b.status !== 'completed'
  );

  // Calcular estadísticas
  const stats = {
    totalReservations: activeBookings.length,
    totalExpected: activeBookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
    depositReceived: activeBookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + Math.round((b.total_price || 0) * 0.25), 0),
    depositPending: activeBookings.filter(b => b.payment_status === 'pending').reduce((sum, b) => sum + Math.round((b.total_price || 0) * 0.25), 0),
    balanceReceived: activeBookings.filter(b => b.balance_status === 'paid').reduce((sum, b) => sum + ((b.total_price || 0) - Math.round((b.total_price || 0) * 0.25)), 0),
    balancePending: activeBookings.filter(b => b.balance_status === 'pending').reduce((sum, b) => sum + ((b.total_price || 0) - Math.round((b.total_price || 0) * 0.25)), 0),
  };

  const totalReceived = stats.depositReceived + stats.balanceReceived;
  const totalPending = stats.depositPending + stats.balancePending;

  // Reservas pendientes de pago
  const pendingDeposits = activeBookings.filter(b => b.payment_status === 'pending');
  const pendingBalances = activeBookings.filter(b => b.payment_status === 'paid' && b.balance_status === 'pending');

  if (isLoading) {
    return <div className="flex justify-center py-12">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalReceived.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Reservas + Saldos cobrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendiente de Cobro</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${totalPending.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingDeposits.length} reservas + {pendingBalances.length} saldos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Esperado</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${stats.totalExpected.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalReservations} reservas activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progreso</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalExpected > 0 ? Math.round((totalReceived / stats.totalExpected) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Cobrado del total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reservas Pendientes de Pago */}
      {pendingDeposits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Reservas Pendientes de Pago ({pendingDeposits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingDeposits.map((booking) => {
                const depositAmount = Math.round((booking.total_price || 0) * 0.25);
                return (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium">{booking.guest_name || 'Sin nombre'}</div>
                      <div className="text-sm text-gray-600">
                        {booking.accommodation_name} • {booking.check_in && format(new Date(booking.check_in), "d MMM", { locale: es })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-yellow-600">${depositAmount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Reserva pendiente</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saldos Pendientes */}
      {pendingBalances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Saldos Pendientes ({pendingBalances.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingBalances.map((booking) => {
                const depositAmount = Math.round((booking.total_price || 0) * 0.25);
                const balanceAmount = (booking.total_price || 0) - depositAmount;
                return (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium">{booking.guest_name || 'Sin nombre'}</div>
                      <div className="text-sm text-gray-600">
                        {booking.accommodation_name} • {booking.check_in && format(new Date(booking.check_in), "d MMM", { locale: es })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">${balanceAmount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Saldo pendiente</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desglose Detallado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reservas (25%)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cobradas</span>
              <span className="font-bold text-green-600">${stats.depositReceived.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pendientes</span>
              <span className="font-bold text-yellow-600">${stats.depositPending.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-600"
                style={{ width: `${stats.depositReceived + stats.depositPending > 0 ? (stats.depositReceived / (stats.depositReceived + stats.depositPending)) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saldos (75%)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cobrados</span>
              <span className="font-bold text-green-600">${stats.balanceReceived.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pendientes</span>
              <span className="font-bold text-yellow-600">${stats.balancePending.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-600"
                style={{ width: `${stats.balanceReceived + stats.balancePending > 0 ? (stats.balanceReceived / (stats.balanceReceived + stats.balancePending)) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}