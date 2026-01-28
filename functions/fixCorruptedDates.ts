import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all bookings
    const bookings = await base44.asServiceRole.entities.Booking.list();
    
    const fixed = [];
    
    for (const booking of bookings) {
      let needsFix = false;
      const updates = {};
      
      // Check if dates are corrupted (contain multiple T or invalid format)
      if (booking.check_in && (booking.check_in.includes('TT') || booking.check_in.match(/T.*T/))) {
        needsFix = true;
        // Extract the date part only
        const dateMatch = booking.check_in.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const checkInDate = new Date(dateMatch[1] + 'T14:00:00-03:00');
          updates.check_in = checkInDate.toISOString();
        }
      }
      
      if (booking.check_out && (booking.check_out.includes('TT') || booking.check_out.match(/T.*T/))) {
        needsFix = true;
        // Extract the date part only
        const dateMatch = booking.check_out.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const checkOutDate = new Date(dateMatch[1] + 'T18:00:00-03:00');
          updates.check_out = checkOutDate.toISOString();
        }
      }
      
      if (needsFix && Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.Booking.update(booking.id, updates);
        fixed.push({
          id: booking.id,
          updates
        });
      }
    }
    
    return Response.json({ 
      success: true,
      fixed: fixed.length,
      details: fixed
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});