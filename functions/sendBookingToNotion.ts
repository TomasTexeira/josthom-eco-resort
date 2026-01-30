import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function toDateOnly(value?: string) {
  if (!value) return null;
  return value.split('T')[0]; // "YYYY-MM-DD"
}

function withArtTime(dateOnly: string, time: string) {
  // time: "14:00:00" o "18:00:00"
  return `${dateOnly}T${time}-03:00`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const bookingData = await req.json();

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");
    const databaseId = Deno.env.get("NOTION_DATABASE_ID");
    if (!databaseId) {
      return Response.json({ error: 'NOTION_DATABASE_ID no configurado' }, { status: 500 });
    }

    // Status mapping Base44 -> Notion
    const statusToNotion: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Pago',
      cancelled: 'Cancelada',
      completed: 'Completa',
    };

    const notionStatus = statusToNotion[bookingData.status] ?? 'Pendiente';

    // Normalize dates to ART check-in/out hours
    const checkInDateOnly = toDateOnly(bookingData.check_in);
    const checkOutDateOnly = toDateOnly(bookingData.check_out);

    const notionCheckIn = checkInDateOnly ? withArtTime(checkInDateOnly, "14:00:00") : null;
    const notionCheckOut = checkOutDateOnly ? withArtTime(checkOutDateOnly, "18:00:00") : null;

    // Build properties safely (no empty values that break Notion)
    const properties: Record<string, any> = {
      "Nombre del huésped": {
        title: [{ text: { content: bookingData.guest_name ?? '' } }]
      },
      "Teléfono / WhatsApp": {
        rich_text: bookingData.guest_phone
          ? [{ text: { content: String(bookingData.guest_phone) } }]
          : []
      },
      "Email": {
        email: bookingData.guest_email ?? ''
      },
      "Cant. huéspedes": {
        number: bookingData.number_of_guests ?? 0
      },
      "Monto total": {
        number: bookingData.total_price ?? 0
      },
      "Id Reserva": {
        rich_text: bookingData.base44_id
          ? [{ text: { content: String(bookingData.base44_id) } }]
          : []
      },
      "Notas": {
        rich_text: bookingData.special_requests
          ? [{ text: { content: String(bookingData.special_requests) } }]
          : []
      },
      "Estado de la reserva": {
        select: { name: notionStatus }
      },
      "Fecha de reserva": {
        date: { start: new Date().toISOString() }
      }
    };

    // Only add cabin if present
    if (bookingData.accommodation_name) {
      properties["Cabaña / Casa"] = {
        multi_select: [{ name: String(bookingData.accommodation_name) }]
      };
    }

    // Only add date range if we have both
    if (notionCheckIn && notionCheckOut) {
      properties["Check-In / Check-Out"] = {
        date: { start: notionCheckIn, end: notionCheckOut }
      };
    }

    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties
      })
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error('Notion API error:', errorText);
      return Response.json(
        { error: 'Error al crear página en Notion', details: errorText },
        { status: notionResponse.status }
      );
    }

    const result = await notionResponse.json();
    return Response.json({ success: true, notionPageId: result.id });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});