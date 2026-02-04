import { createClient, createClientFromRequest } from "npm:@base44/sdk@0.8.6";

const NOTION_VERSION = "2022-06-28";

function getBase44Client(req: Request) {
  // Manual (HTTP): tiene contexto de request
  try {
    return createClientFromRequest(req);
  } catch (_e) {
    // Cron/Automation: NO hay contexto, usar token de servicio
    const token = Deno.env.get("BASE44_SERVICE_ROLE_TOKEN");
    if (!token) throw new Error("Missing env var: BASE44_SERVICE_ROLE_TOKEN");
    return createClient({ token });
  }
}

function toDateOnly(iso?: string | null) {
  return iso ? iso.split("T")[0] : null;
}

function toArtIso(dateOnly: string, time: "14:00:00" | "18:00:00") {
  return new Date(`${dateOnly}T${time}-03:00`).toISOString();
}

Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");
    const databaseId = Deno.env.get("NOTION_DATABASE_ID");
    if (!databaseId) return Response.json({ error: "NOTION_DATABASE_ID no configurado" }, { status: 500 });

    const statusMap: Record<string, string> = {
      Pendiente: "pending",
      Pago: "confirmed",
      Cancelada: "cancelled",
      Completa: "completed",
    };

    const updates: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const notionResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Notion-Version": NOTION_VERSION,
        },
        body: JSON.stringify({
          start_cursor: startCursor,
          page_size: 100,
          filter: {
            property: "BookingID44",
            rich_text: { is_not_empty: true },
          },
        }),
      });

      if (!notionResponse.ok) {
        const errorText = await notionResponse.text();
        return Response.json({ error: "Error consultando Notion", details: errorText }, { status: notionResponse.status });
      }

      const notionData = await notionResponse.json();

      for (const page of notionData.results || []) {
        const props = page.properties || {};

        const bookingId =
          props["BookingID44"]?.rich_text?.[0]?.plain_text ||
          props["BookingID44"]?.rich_text?.[0]?.text?.content;

        if (!bookingId) continue;

        const notionStatus = props["Estado de la reserva"]?.select?.name;
        const mappedStatus = notionStatus ? statusMap[notionStatus] : undefined;

        const range = props["Check-In / Check-Out"]?.date;
        const nStartDay = toDateOnly(range?.start);
        const nEndDay = toDateOnly(range?.end);

        const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
        if (!booking) continue;

        const updateData: Record<string, any> = {};
        let hasChanges = false;

        // Status
        if (mappedStatus && booking.status !== mappedStatus) {
          updateData.status = mappedStatus;
          hasChanges = true;
        }

        // Dates (compare by day)
        const bStartDay = toDateOnly(booking.check_in);
        const bEndDay = toDateOnly(booking.check_out);

        if (nStartDay && nEndDay && (bStartDay !== nStartDay || bEndDay !== nEndDay)) {
          updateData.check_in = toArtIso(nStartDay, "14:00:00");
          updateData.check_out = toArtIso(nEndDay, "18:00:00");
          hasChanges = true;
        }

        // Optional: guests + total
        const guests = props["Cant. huéspedes"]?.number;
        if (typeof guests === "number" && booking.number_of_guests !== guests) {
          updateData.number_of_guests = guests;
          hasChanges = true;
        }

        const total = props["Monto total"]?.number;
        if (typeof total === "number" && booking.total_price !== total) {
          updateData.total_price = total;
          hasChanges = true;
        }

        if (hasChanges) {
          await base44.asServiceRole.entities.Booking.update(booking.id, updateData);
          updates.push({ booking_id: booking.id, notion_page_id: page.id, changes: updateData });
        }
      }

      hasMore = Boolean(notionData.has_more);
      startCursor = notionData.next_cursor || undefined;
    }

    return Response.json({ success: true, synced: updates.length, updates });
  } catch (error) {
    return Response.json({ error: String(error?.message || error) }, { status: 500 });
  }
});