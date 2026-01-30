import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

function toDateOnly(iso) {
  return iso ? iso.split("T")[0] : null;
}

function withArtTime(dateOnly, time) {
  return new Date(`${dateOnly}T${time}-03:00`).toISOString();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");
    const databaseId = Deno.env.get("NOTION_DATABASE_ID");
    if (!databaseId) {
      return Response.json({ error: "NOTION_DATABASE_ID no configurado" }, { status: 500 });
    }

    // Consultar todas las páginas de Notion
    const notionResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        page_size: 100,
      }),
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      return Response.json({ error: "Error consultando Notion", details: errorText }, { status: notionResponse.status });
    }

    const notionData = await notionResponse.json();

    const statusMap = {
      Pendiente: "pending",
      Pago: "confirmed",
      Cancelada: "cancelled",
      Completa: "completed",
    };

    const created = [];
    const skipped = [];

    for (const page of notionData.results ?? []) {
      const props = page.properties;

      // Verificar si ya tiene booking.id en "Id Reserva"
      const existingBookingId =
        props["Id Reserva"]?.rich_text?.[0]?.plain_text ||
        props["Id Reserva"]?.rich_text?.[0]?.text?.content;

      // Si ya tiene ID, verificar si existe en Base44
      if (existingBookingId) {
        try {
          await base44.asServiceRole.entities.Booking.get(existingBookingId);
          skipped.push({ page_id: page.id, reason: "Ya tiene booking.id", booking_id: existingBookingId });
          continue; // Ya existe, skip
        } catch (error) {
          // No existe, continuar para crear
        }
      }

      // Extraer datos de Notion - intentar múltiples formatos
      let accommodationId = props["Alojamiento"]?.select?.name || 
                           props["Alojamiento"]?.rich_text?.[0]?.plain_text ||
                           props["Alojamiento"]?.title?.[0]?.plain_text;
      const notionStatus = props["Estado de la reserva"]?.select?.name;
      const dateRange = props["Check-In / Check-Out"]?.date;
      const guestName = props["Nombre del huésped"]?.title?.[0]?.plain_text;
      const guestEmail = props["Email"]?.email;
      const guestPhone = props["Teléfono"]?.phone_number;
      const numberOfGuests = props["Número de huéspedes"]?.number;
      const totalPrice = props["Precio total"]?.number;

      const inDate = toDateOnly(dateRange?.start);
      const outDate = toDateOnly(dateRange?.end);

      if (!accommodationId || !inDate || !outDate) {
        skipped.push({ 
          page_id: page.id, 
          reason: "Faltan datos", 
          accommodationId, 
          inDate, 
          outDate, 
          guestName,
          alojamiento_raw: props["Alojamiento"]
        });
        continue; // Faltan datos esenciales
      }

      // Buscar el accommodation en Base44
      const accommodations = await base44.asServiceRole.entities.Accommodation.filter({ name: accommodationId });
      if (!accommodations || accommodations.length === 0) {
        skipped.push({ page_id: page.id, reason: "Alojamiento no encontrado", accommodationId });
        continue; // No se encontró el alojamiento
      }
      const accommodation = accommodations[0];

      // Crear booking en Base44
      const bookingData = {
        accommodation_id: accommodation.id,
        accommodation_name: accommodation.name,
        check_in: withArtTime(inDate, "14:00:00"),
        check_out: withArtTime(outDate, "18:00:00"),
        status: notionStatus ? (statusMap[notionStatus] || "pending") : "pending",
        guest_name: guestName || "",
        guest_email: guestEmail || "",
        guest_phone: guestPhone || "",
        number_of_guests: numberOfGuests || 1,
        total_price: totalPrice || 0,
        source: "other",
      };

      const newBooking = await base44.asServiceRole.entities.Booking.create(bookingData);

      // Actualizar Notion con el booking.id en ambas columnas
      await fetch(`https://api.notion.com/v1/pages/${page.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          properties: {
            "Id Reserva": {
              rich_text: [{ text: { content: newBooking.id } }],
            },
            "BookingID44": {
              rich_text: [{ text: { content: newBooking.id } }],
            },
          },
        }),
      });

      created.push({ booking_id: newBooking.id, notion_page_id: page.id });
    }

    // Enviar correo si se crearon reservas
    if (created.length > 0) {
      const createList = created.map(c => `- Booking ${c.booking_id} (Notion: ${c.notion_page_id})`).join('\n');

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: "tom.tex2322@gmail.com",
        subject: `Josthom: ${created.length} ${created.length === 1 ? 'reserva creada' : 'reservas creadas'} desde Notion`,
        body: `Se crearon ${created.length} ${created.length === 1 ? 'reserva nueva' : 'reservas nuevas'} desde Notion en Base44:\n\n${createList}`
      });
    }

    return Response.json({ success: true, created: created.length, bookings: created, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});