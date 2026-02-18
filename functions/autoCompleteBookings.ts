import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticación admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ 
        error: 'Forbidden: Admin access required' 
      }, { status: 403 });
    }

    // Obtener todas las reservas confirmadas
    const bookings = await base44.asServiceRole.entities.Booking.filter({
      status: 'confirmed'
    });

    const now = new Date();
    let completedCount = 0;

    // Actualizar reservas cuyo checkout ya pasó
    for (const booking of bookings) {
      const checkoutDate = new Date(booking.check_out);
      
      // Si la fecha de checkout ya pasó
      if (checkoutDate <= now) {
        await base44.asServiceRole.entities.Booking.update(booking.id, {
          status: 'completed'
        });
        completedCount++;
      }
    }

    return Response.json({
      success: true,
      message: `${completedCount} reservas marcadas como completadas`,
      completedCount,
      processedAt: now.toISOString()
    });

  } catch (error) {
    console.error('Error en autoCompleteBookings:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});