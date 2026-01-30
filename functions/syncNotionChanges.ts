import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function toDateOnly(iso?: string | null) {
  return iso ? iso.split('T')[0] : null; // "YYYY-MM-DD"
}

function withArtTime(dateOnly: string, time: string) {
  // Argentina UTC-3
  const d = new Date(`${dateOnly}T${time}-03:00`);
  return d.toISOString();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");
    const databaseId = Deno.env.get("NOTION_DATABASE_ID");

    if (!databaseId) {
      return Response.json({ error: 'NOTION_DATABASE_ID no configurado' }, { status: 500 });
    }

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
          rich_text: { is_not_empty: true }
        }
      })
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error('Notion API error:', errorText);
      return Response.json({ error: 'Error consultando Notion', details: errorText }, { status: notionResponse.status });
    }

    const notionData = await notionResponse.json();

    const statusMap: Record<string, string> = {
      'Pendiente': 'pending',
      'Pago': 'confirmed',
      'Cancelada': 'cancelled',
      'Completa': 'completed'
    };

    const updates: any[] = [];

    for (const page of notionData.results) {
      const props = page.properties;

      const base44Id =
        props["Id Reserva"]?.rich_text?.[0]?.plain_text ||
        props["Id Reserva"]?.rich_text?.[0]?.text?.content;

      if (!base44Id) continue;

      const notionStatus = props["Estado de la reserva"]?.select?.name;
      const mappedStatus = notionStatus ? statusMap[notionStatus] : null;
      if (!mappedStatus) continue;

      const dateRange = props["Check-In / Check-Out"]?.date;
      const notionCheckInDate = toDateOnly(dateRange?.start);
      const notionCheckOutDate = toDateOnly(dateRange?.end);

      try {
        const booking = await base44.asServiceRole.entities.Booking.get(base44Id);
        if (!booking) continue;

        const updateData: Record<string, any> = {};
        let hasChanges = false;

        // status
        if (booking.status !== mappedStatus) {
          updateData.status = mappedStatus;
          hasChanges = true;
        }

        // dates (compare date-only; store with 14/18 ART)
        if (notionCheckInDate && notionCheckOutDate) {
          const bookingCheckInDate = toDateOnly(booking.check_in);
          const bookingCheckOutDate = toDateOnly(booking.check_out);

          if (bookingCheckInDate !== notionCheckInDate || bookingCheckOutDate !== notionCheckOutDate) {
            updateData.check_in = withArtTime(notionCheckInDate, "14:00:00");
            updateData.check_out = withArtTime(notionCheckOutDate, "18:00:00");
            hasChanges = true;
          }
        }

        if (hasChanges) {
          await base44.asServiceRole.entities.Booking.update(booking.id, updateData);
          updates.push({ base44_id: booking.id, changes: updateData });
        }

      } catch (error) {
        console.error(`Error syncing booking ${base44Id}:`, error);
      }
    }

    return Response.json({ success: true, synced: updates.length, updates });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});