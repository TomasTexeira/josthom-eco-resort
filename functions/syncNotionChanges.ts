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
          property: "Id Base44",
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
      
      // Extract Base44 ID
      const base44Id = props["Id Base44"]?.rich_text?.[0]?.text?.content;
      if (!base44Id) continue;

      // Extract status from Notion
      const notionStatus = props["Estado de la reserva"]?.select?.name;
      if (!notionStatus) continue;

      const mappedStatus = statusMap[notionStatus];
      if (!mappedStatus) continue;

      try {
        // Get current booking from Base44
        const booking = await base44.asServiceRole.entities.Booking.get(base44Id);
        
        // Update if status changed
        if (booking && booking.status !== mappedStatus) {
          await base44.asServiceRole.entities.Booking.update(base44Id, {
            status: mappedStatus
          });
          updates.push({
            base44_id: base44Id,
            old_status: booking.status,
            new_status: mappedStatus
          });
        }
      } catch (error) {
        console.error(`Error syncing booking ${base44Id}:`, error);
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