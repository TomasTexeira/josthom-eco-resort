import { createClient, createClientFromRequest } from "npm:@base44/sdk@0.8.6";

const NOTION_VERSION = "2022-06-28";

function getBase44(req: Request) {
  try {
    return createClientFromRequest(req); // cuando lo llamás manual via HTTP
  } catch {
    const token = Deno.env.get("BASE44_SERVICE_ROLE_TOKEN");
    if (!token) throw new Error("Missing env var: BASE44_SERVICE_ROLE_TOKEN");
    return createClient({ token }); // cron automation
  }
}

function readRichText(props: any, key: string) {
  const rt = props?.[key]?.rich_text;
  if (!rt || !rt.length) return null;
  return rt[0]?.plain_text || rt[0]?.text?.content || null;
}

function dateOnly(iso?: string | null) {
  return iso ? iso.split("T")[0] : null;
}

function artIso(dateOnlyStr: string, time: "14:00:00" | "18:00:00") {
  return new Date(`${dateOnlyStr}T${time}-03:00`).toISOString();
}

Deno.serve(async (req) => {
  try {
    const base44 = getBase44(req);

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
    const debug: any[] = [];

    let startCursor: string | undefined;
    let hasMore = true;

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
        return Response.json(
          { error: "Error consultando Notion", details: await notionResponse.text() },
          { status: notionResponse.status },
        );
      }

      const notionData = await notionResponse.json();

      for (const page of notionData.results || []) {
        const props = page.properties || {};

        // ✅ ID correcto SIEMPRE desde BookingID44
        const bookingId = readRichText(props, "BookingID44");
        if (!bookingId) continue;

        const notionStatusName = props["Estado de la reserva"]?.select?.name || null;
        const mappedStatus = notionStatusName ? statusMap[notionStatusName] : null;

        const range = props["Check-In / Check-Out"]?.date;
        const nIn = dateOnly(range?.start);
        const nOut = dateOnly(range?.end);

        // Traer booking en Base44 por ID
        const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
        if (!booking) {
          debug.push({ page: page.id, bookingId, reason: "BookingID44 no existe en Base44" });
          continue;
        }

        const bIn = dateOnly(booking.check_in);
        const bOut = dateOnly(booking.check_out);

        const updateData: Record<string, any> = {};
        let changed = false;

        // status
        if (mappedStatus && booking.status !== mappedStatus) {
          updateData.status = mappedStatus;
          changed = true;
        }

        // fechas (comparación solo por día)
        if (nIn && nOut && (nIn !== bIn || nOut !== bOut)) {
          updateData.check_in = artIso(nIn, "14:00:00");
          updateData.check_out = artIso(nOut, "18:00:00");
          changed = true;
        }

        if (changed) {
          await base44.asServiceRole.entities.Booking.update(booking.id, updateData);
          updates.push({ booking_id: booking.id, notion_page_id: page.id, changes: updateData });
        } else {
          debug.push({
            page: page.id,
            bookingId,
            reason: "Sin cambios",
            status: { notion: notionStatusName, base44: booking.status },
            dates: { notion: { nIn, nOut }, base44: { bIn, bOut } },
          });
        }
      }

      hasMore = Boolean(notionData.has_more);
      startCursor = notionData.next_cursor || undefined;
    }

    return Response.json({ success: true, synced: updates.length, updates, debug_sample: debug.slice(0, 10) });
  } catch (error) {
    return Response.json({ error: String(error?.message || error) }, { status: 500 });
  }
});