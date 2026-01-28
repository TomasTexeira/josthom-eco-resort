import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get booking data from request
    const bookingData = await req.json();
    
    // Get Notion access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");
    const databaseId = Deno.env.get("NOTION_DATABASE_ID");

    if (!databaseId) {
      return Response.json({ error: 'NOTION_DATABASE_ID no configurado' }, { status: 500 });
    }

    // Create page in Notion database
    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          "Nombre del huésped": {
            title: [{ text: { content: bookingData.guest_name || '' } }]
          },
          "Teléfono / WhatsApp": {
            rich_text: [{ text: { content: bookingData.guest_phone || '' } }]
          },
          "Email": {
            email: bookingData.guest_email || ''
          },
          "Cabaña / Casa": {
            multi_select: [{ name: bookingData.accommodation_name || '' }]
          },
          "Check-In / Check-Out": {
            date: { 
              start: bookingData.check_in,
              end: bookingData.check_out
            }
          },
          "Cant. huéspedes": {
            number: bookingData.number_of_guests || 0
          },
          "Monto total": {
            number: bookingData.total_price || 0
          },
          "Id Reserva": {
            rich_text: [{ text: { content: bookingData.accommodation_id || '' } }]
          },
          "Notas": {
            rich_text: [{ text: { content: bookingData.special_requests || '' } }]
          },
          "Estado de la reserva": {
            select: { 
              name: bookingData.status === 'confirmed' ? 'Pago' : 'Pendiente'
            }
          },
          "Fecha de reserva": {
            date: { start: new Date().toISOString().split('T')[0] }
          }
        }
      })
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error('Notion API error:', errorText);
      return Response.json({ 
        error: 'Error al crear página en Notion',
        details: errorText 
      }, { status: notionResponse.status });
    }

    const result = await notionResponse.json();
    
    return Response.json({ 
      success: true,
      notionPageId: result.id 
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});