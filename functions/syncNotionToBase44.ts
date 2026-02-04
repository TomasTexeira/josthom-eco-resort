import { createClient, createClientFromRequest } from "npm:@base44/sdk@0.8.6";

const NOTION_VERSION = "2022-06-28";

function getBase44(req: Request) {
  try {
    return createClientFromRequest(req);
  } catch {
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

async function patchNotion(accessToken: string, pageId: string, properties: Record<string, any>) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
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

    // Traigo accommodations para mapear "Cabaña 1..6" -> accommodation_id
    const acc = await base44.asServiceRole.entities.Accommodation.list({ limit: 200 }).catch(() => ({ items: [] }));
    const accommodations = acc.items || [];

    const created: any[] = [];
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
            rich_text: { is_empty: true },
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

        // multi_select: tomamos el primero
        const accommodationName = props["Cabaña / Casa"]?.multi_select?.[0]?.name;
        if (!accommodationName) continue;

        const accommodation = accommodations.find((a: any) => a.name === accommodationName);
        if (!accommodation) continue;

        const range = props["Check-In / Check-Out"]?.date;
        const inDay = toDateOnly(range?.start);
        const outDay = toDateOnly(range?.end);
        if (!inDay || !outDay) continue;

        const guestName = props["Nombre del huésped"]?.title?.[0]?.plain_text || "";
        const guestEmail = props["Email"]?.email || "";
        const guestPhone = props["Teléfono / WhatsApp"]?.rich_text?.[0]?.plain_text || "";
        const notes = props["Notas"]?.rich_text?.[0]?.plain_text || "";

        const guests = props["Cant. huéspedes"]?.number ?? 0;
        const total = props["Monto total"]?.number ?? 0;

        const notionStatus = props["Estado de la reserva"]?.select?.name || "Pendiente";
        const mappedStatus = statusMap[notionStatus] || "pending";

        // Crear booking en Base44
        const booking = await base44.asServiceRole.entities.Booking.create({
          accommodation_id: accommodation.id,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          special_requests: notes,
          number_of_guests: guests,
          total_price: total,
          status: mappedStatus,
          check_in: artIso(inDay, "14:00:00"),
          check_out: artIso(outDay, "18:00:00"),
        });

        // Escribir BookingID44 en Notion
        await patchNotion(accessToken, page.id, {
          BookingID44: { rich_text: [{ text: { content: booking.id } }] },
        });

        created.push({ notion_page_id: page.id, booking_id: booking.id, accommodation_id: accommodation.id });
      }

      hasMore = Boolean(data.has_more);
      startCursor = data.next_cursor || undefined;
    }

    return Response.json({ success: true, created: created.length, items: created });
  } catch (e) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
});