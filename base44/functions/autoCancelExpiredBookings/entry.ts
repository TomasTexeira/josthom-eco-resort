import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Obtener todas las reservas pendientes
    const bookings = await base44.asServiceRole.entities.Booking.filter({ status: 'pending' });

    const now = new Date();
    let cancelled = 0;

    for (const booking of bookings) {
      if (!booking.check_out) continue;
      const checkOut = new Date(booking.check_out);
      if (checkOut < now) {
        await base44.asServiceRole.entities.Booking.update(booking.id, { status: 'cancelled' });
        cancelled++;
      }
    }

    return Response.json({ success: true, cancelled, checked: bookings.length, timestamp: now.toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});