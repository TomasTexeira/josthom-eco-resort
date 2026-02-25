import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Home, Image, FileText, CalendarDays, DollarSign } from 'lucide-react';
import BookingsManager from '@/components/admin/BookingsManager';
import AccommodationsManager from '@/components/admin/AccommodationsManager';
import GalleryManager from '@/components/admin/GalleryManager';
import ContentManager from '@/components/admin/ContentManager';
import CalendarView from '@/components/admin/CalendarView';
import BalanceDashboard from '@/components/admin/BalanceDashboard';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('bookings');

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Si no está autenticado, redirigir al login
  React.useEffect(() => {
    if (error || (!isLoading && !user)) {
      base44.auth.redirectToLogin(window.location.pathname);
    }
  }, [error, isLoading, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirigiendo...
  }

  if (!['admin', 'booking_manager'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder al backoffice.</p>
        </div>
      </div>
    );
  }

  // Solo mostrar pestaña de reservas si es booking_manager
  const isBookingManager = user.role === 'booking_manager';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Backoffice Josthom</h1>
          <p className="text-gray-600 mt-2">
            {isBookingManager ? 'Gestión de Reservas' : 'Panel de administración'}
          </p>
        </div>

        {isBookingManager ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="bookings" className="gap-2 py-3">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Reservas</span>
                <span className="sm:hidden">Reservas</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2 py-3">
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">Calendario</span>
                <span className="sm:hidden">Calendario</span>
              </TabsTrigger>
              <TabsTrigger value="balance" className="gap-2 py-3">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Balances</span>
                <span className="sm:hidden">Balances</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <BookingsManager />
            </TabsContent>

            <TabsContent value="calendar">
              <CalendarView />
            </TabsContent>

            <TabsContent value="balance">
              <BalanceDashboard />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 gap-2 h-auto sm:grid-cols-6 lg:w-auto lg:inline-grid">
              <TabsTrigger value="bookings" className="gap-1 sm:gap-2 py-3 text-xs sm:text-sm">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Reservas</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1 sm:gap-2 py-3 text-xs sm:text-sm">
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">Calendario</span>
              </TabsTrigger>
              <TabsTrigger value="balance" className="gap-1 sm:gap-2 py-3 text-xs sm:text-sm">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Balances</span>
              </TabsTrigger>
              <TabsTrigger value="accommodations" className="gap-1 sm:gap-2 py-3 text-xs sm:text-sm">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Alojamientos</span>
              </TabsTrigger>
              <TabsTrigger value="gallery" className="gap-1 sm:gap-2 py-3 text-xs sm:text-sm">
                <Image className="w-4 h-4" />
                <span className="hidden sm:inline">Galería</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-1 sm:gap-2 py-3 text-xs sm:text-sm">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Contenido</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <BookingsManager />
            </TabsContent>

            <TabsContent value="calendar">
              <CalendarView />
            </TabsContent>

            <TabsContent value="balance">
              <BalanceDashboard />
            </TabsContent>

            <TabsContent value="accommodations">
              <AccommodationsManager />
            </TabsContent>

            <TabsContent value="gallery">
              <GalleryManager />
            </TabsContent>

            <TabsContent value="content">
              <ContentManager />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}