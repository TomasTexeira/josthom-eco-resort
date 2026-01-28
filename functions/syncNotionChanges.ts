import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get Notion access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");
    const databaseId = Deno.env.get("NOTION_DATABASE_ID");

    if (!databaseId) {
      return Response.json({ error: 'NOTION_DATABASE_ID no configurado' }, { status: 500 });
    }

    // Query Notion database
    const notionResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filter: {
          property: "Id Reserva",
          rich_text: {
            is_not_empty: true
          }
        }
      })
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error('Notion API error:', errorText);
      return Response.json({ 
        error: 'Error consultando Notion',
        details: errorText 
      }, { status: notionResponse.status });
    }

    const notionData = await notionResponse.json();
    
    // Map Notion status to Base44 status
    const statusMap = {
      'Pendiente': 'pending',
      'Pago': 'confirmed',
      'Cancelada': 'cancelled',
      'Completa': 'completed'
    };

    const updates = [];

    // Process each Notion page
    for (const page of notionData.results) {
      const props = page.properties;
      
      // Extract accommodation ID
      const accommodationId = props["Id Reserva"]?.rich_text?.[0]?.text?.content;
      if (!accommodationId) continue;

      // Extract dates
      const dateRange = props["Check-In / Check-Out"]?.date;
      if (!dateRange?.start) continue;

      const checkIn = dateRange.start;
      const checkOut = dateRange.end;

      // Extract status from Notion
      const notionStatus = props["Estado de la reserva"]?.select?.name;
      if (!notionStatus) continue;

      const mappedStatus = statusMap[notionStatus];
      if (!mappedStatus) continue;

      try {
        // Find booking by accommodation_id and dates
        const bookings = await base44.asServiceRole.entities.Booking.filter({
          accommodation_id: accommodationId,
          check_in: checkIn,
          check_out: checkOut
        });

        if (bookings.length === 0) continue;
        
        const booking = bookings[0];
        
        // Update if status changed
        if (booking.status !== mappedStatus) {
          await base44.asServiceRole.entities.Booking.update(booking.id, {
            status: mappedStatus
          });
          updates.push({
            base44_id: booking.id,
            accommodation_id: accommodationId,
            old_status: booking.status,
            new_status: mappedStatus
          });
        }
      } catch (error) {
        console.error(`Error syncing booking for accommodation ${accommodationId}:`, error);
      }
    }

    return Response.json({ 
      success: true,
      synced: updates.length,
      updates
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});