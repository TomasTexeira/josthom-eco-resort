import { createClient, createClientFromRequest } from "npm:@base44/sdk@0.8.6";

const NOTION_VERSION = "2022-06-28";

function getBase44(req: Request) {
  try {
    // llamadas HTTP normales
    return createClientFromRequest(req);
  } catch {
    // automatizaciones programadas (cron)
    const token = Deno.env.get("BASE44_SERVICE_ROLE_TOKEN");
    if (!token) throw new Error("Missing env var: BASE44_SERVICE_ROLE_TOKEN");
    return createClient({ token });
  }
}

function toDateOnly(iso?: string | null) {
  return iso ? iso.split("T")[0] : null;
}

function artIso(dateOnly: string, time: "14:00:00" | "18:00:00") {
  return new Date(`${dateOnly}T${time}-03:00`).toISOString();
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
    let startCursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const notionRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
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

      if (!notionRes.ok) {
        const t = await notionRes.text();
        return Response.json({ error: "Notion query failed", details: t }, { status: notionRes.status });
      }

      const data = await notionRes.json();

      for (const page of data.results || []) {
        const props = page.properties || {};

        const bookingId =
          props["BookingID44"]?.rich_text?.[0]?.plain_text ||
          props["BookingID44"]?.rich_text?.[0]?.text?.content;

        if (!bookingId) continue;

        const notionStatus = props["Estado de la reserva"]?.select?.name;
        const mappedStatus = notionStatus ? statusMap[notionStatus] : undefined;

        const range = props["Check-In / Check-Out"]?.date;
        const nIn = toDateOnly(range?.start);
        const nOut = toDateOnly(range?.end);

        const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
        if (!booking) continue;

        const updateData: Record<string, any> = {};
        let changed = false;

        if (mappedStatus && booking.status !== mappedStatus) {
          updateData.status = mappedStatus;
          changed = true;
        }

        const bIn = toDateOnly(booking.check_in);
        const bOut = toDateOnly(booking.check_out);

        if (nIn && nOut && (nIn !== bIn || nOut !== bOut)) {
          updateData.check_in = artIso(nIn, "14:00:00");
          updateData.check_out = artIso(nOut, "18:00:00");
          changed = true;
        }

        if (changed) {
          await base44.asServiceRole.entities.Booking.update(booking.id, updateData);
          updates.push({ booking_id: booking.id, notion_page_id: page.id, changes: updateData });
        }
      }

      hasMore = Boolean(data.has_more);
      startCursor = data.next_cursor || undefined;
    }

    return Response.json({ success: true, synced: updates.length, updates });
  } catch (e) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
});