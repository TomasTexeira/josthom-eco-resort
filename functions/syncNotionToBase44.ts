import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const updateData = await req.json();
    const { base44_id, status, check_in, check_out, number_of_guests, total_price } = updateData;

    if (!base44_id) {
      return Response.json({ error: 'base44_id es requerido' }, { status: 400 });
    }

    // Map Notion status to Base44 status
    const statusMap = {
      'Pendiente': 'pending',
      'Pago': 'confirmed',
      'Cancelada': 'cancelled',
      'Completa': 'completed'
    };

    const mappedStatus = statusMap[status] || status;

    // Build update object with only provided fields
    const updateFields = {};
    if (mappedStatus) updateFields.status = mappedStatus;
    if (check_in) updateFields.check_in = check_in;
    if (check_out) updateFields.check_out = check_out;
    if (number_of_guests) updateFields.number_of_guests = number_of_guests;
    if (total_price) updateFields.total_price = total_price;

    // Update booking in Base44
    const updatedBooking = await base44.asServiceRole.entities.Booking.update(
      base44_id,
      updateFields
    );

    return Response.json({ 
      success: true,
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Error syncing from Notion:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});