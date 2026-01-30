import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

function toDateOnly(iso?: string | null) {
  return iso ? iso.split("T")[0] : null; // YYYY-MM-DD
}

function withArtTime(dateOnly: string, time: string) {
  return new Date(`${dateOnly}T${time}-03:00`).toISOString();
}

Deno.serve(async (req) => {
  try {
    console.log("🔍 [DEBUG] Iniciando syncNotionChanges");
    
    const base44 = createClientFromRequest(req);
    console.log("🔍 [DEBUG] Cliente creado");

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");
    console.log("🔍 [DEBUG] AccessToken obtenido:", accessToken ? "✅ SI" : "❌ NO");
    
    const databaseId = Deno.env.get("NOTION_DATABASE_ID");
    console.log("🔍 [DEBUG] NOTION_DATABASE_ID:", databaseId ? "✅ SI" : "❌ NO");
    
    if (!databaseId) {
      return Response.json({ error: "NOTION_DATABASE_ID no configurado" }, { status: 500 });
    }

    console.log("🔍 [DEBUG] Consultando Notion con filtro de 'Id Reserva' no vacío...");
    const notionResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        filter: {
          property: "Id Reserva",
          rich_text: { is_not_empty: true },
        },
        page_size: 100,
      }),
    });

    console.log("🔍 [DEBUG] Respuesta de Notion:", notionResponse.status);
    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error("❌ [ERROR] Error consultando Notion:", errorText);
      return Response.json({ error: "Error consultando Notion", details: errorText }, { status: notionResponse.status });
    }

    const notionData = await notionResponse.json();
    console.log("🔍 [DEBUG] Páginas encontradas con Id Reserva:", notionData.results?.length || 0);

    const statusMap: Record<string, string> = {
      Pendiente: "pending",
      Pago: "confirmed",
      Cancelada: "cancelled",
      Completa: "completed",
    };

    const updates: any[] = [];

    for (const page of notionData.results ?? []) {
      console.log("🔍 [DEBUG] Procesando página:", page.id);
      const props = page.properties;

      // Id Reserva = booking.id de Base44
      const bookingId =
        props["Id Reserva"]?.rich_text?.[0]?.plain_text ||
        props["Id Reserva"]?.rich_text?.[0]?.text?.content;

      console.log("🔍 [DEBUG] bookingId extraído:", bookingId);

      if (!bookingId) {
        console.log("⚠️ [DEBUG] No hay bookingId, skip");
        continue;
      }

      // Extraer todas las propiedades de Notion
      const notionStatus = props["Estado de la reserva"]?.select?.name;
      const mappedStatus = notionStatus ? statusMap[notionStatus] : null;
      
      const dateRange = props["Check-In / Check-Out"]?.date;
      const inDate = toDateOnly(dateRange?.start);
      const outDate = toDateOnly(dateRange?.end);
      
      const guestName = props["Nombre del huésped"]?.title?.[0]?.plain_text || "";
      const guestEmail = props["Email"]?.email || "";
      const guestPhone = props["Teléfono / WhatsApp"]?.phone_number || 
                        props["Teléfono / WhatsApp"]?.rich_text?.[0]?.plain_text || "";
      const numberOfGuests = props["Número de huéspedes"]?.number;
      const totalPrice = props["Monto total"]?.number;
      const specialRequests = props["Peticiones especiales"]?.rich_text?.[0]?.plain_text || 
                             props["Notas"]?.rich_text?.[0]?.plain_text || "";
      
      // Validar campos mínimos requeridos
      if (!inDate || !outDate) continue;

      // Buscar booking directamente por ID
      console.log("🔍 [DEBUG] Buscando booking:", bookingId);
      let booking;
      try {
        booking = await base44.asServiceRole.entities.Booking.get(bookingId);
        console.log("✅ [DEBUG] Booking encontrado");
      } catch (error) {
        console.warn(`⚠️ [DEBUG] Booking ${bookingId} not found in Base44:`, error.message);
        continue;
      }

      if (!booking) {
        console.log("⚠️ [DEBUG] Booking es null, skip");
        continue;
      }

      const updateData: Record<string, any> = {};
      let hasChanges = false;

      // status
      if (mappedStatus && booking.status !== mappedStatus) {
        updateData.status = mappedStatus;
        hasChanges = true;
      }

      // fechas (siempre fijamos 14/18)
      const desiredCheckIn = withArtTime(inDate, "14:00:00");
      const desiredCheckOut = withArtTime(outDate, "18:00:00");

      if (booking.check_in !== desiredCheckIn || booking.check_out !== desiredCheckOut) {
        updateData.check_in = desiredCheckIn;
        updateData.check_out = desiredCheckOut;
        hasChanges = true;
      }

      // guest_name
      if (guestName && booking.guest_name !== guestName) {
        updateData.guest_name = guestName;
        hasChanges = true;
      }

      // guest_email
      if (guestEmail && booking.guest_email !== guestEmail) {
        updateData.guest_email = guestEmail;
        hasChanges = true;
      }

      // guest_phone
      if (guestPhone && booking.guest_phone !== guestPhone) {
        updateData.guest_phone = guestPhone;
        hasChanges = true;
      }

      // number_of_guests
      if (numberOfGuests !== undefined && numberOfGuests !== null && booking.number_of_guests !== numberOfGuests) {
        updateData.number_of_guests = numberOfGuests;
        hasChanges = true;
      }

      // total_price
      if (totalPrice !== undefined && totalPrice !== null && booking.total_price !== totalPrice) {
        updateData.total_price = totalPrice;
        hasChanges = true;
      }

      // special_requests
      if (specialRequests && booking.special_requests !== specialRequests) {
        updateData.special_requests = specialRequests;
        hasChanges = true;
      }

      if (hasChanges) {
        console.log("🔍 [DEBUG] Actualizando booking:", booking.id, "con:", updateData);
        await base44.asServiceRole.entities.Booking.update(booking.id, updateData);
        updates.push({ booking_id: booking.id, changes: updateData });
        console.log("✅ [DEBUG] Booking actualizado");
      } else {
        console.log("✅ [DEBUG] No hay cambios para este booking");
      }
      }

      console.log("🔍 [DEBUG] Proceso completado. Updates:", updates.length);

      // Enviar correo si hubo actualizaciones
      if (updates.length > 0) {
      const updateList = updates.map(u => 
      `- Booking ${u.booking_id}: ${Object.entries(u.changes).map(([k, v]) => `${k}=${v}`).join(', ')}`
      ).join('\n');

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: "tom.tex2322@gmail.com",
        subject: `Josthom: ${updates.length} ${updates.length === 1 ? 'reserva sincronizada' : 'reservas sincronizadas'} desde Notion`,
        body: `Se sincronizaron ${updates.length} ${updates.length === 1 ? 'reserva' : 'reservas'} desde Notion a Base44:\n\n${updateList}`
      });
    }

    console.log("✅ [DEBUG] Función completada exitosamente");
    return Response.json({ success: true, synced: updates.length, updates });
  } catch (error) {
    console.error("❌ [ERROR] Error en syncNotionChanges:", error.message);
    console.error("❌ [ERROR] Stack:", error.stack);
    return Response.json({ error: (error as Error).message, stack: error.stack }, { status: 500 });
  }
});