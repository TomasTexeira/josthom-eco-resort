import { createClient, createClientFromRequest } from "npm:@base44/sdk@0.8.6";
const NOTION_VERSION = "2022-06-28";

function getBase44(req: Request) {
  try { return createClientFromRequest(req); }
  catch {
    const token = Deno.env.get("BASE44_SERVICE_ROLE_TOKEN");
    if (!token) throw new Error("Missing BASE44_SERVICE_ROLE_TOKEN");
    return createClient({ token });
  }
}

function rtPlain(props: any, key: string) {
  const rt = props?.[key]?.rich_text;
  if (!rt || !rt.length) return "";
  return rt.map((x: any) => x?.plain_text || x?.text?.content || "").join("").trim();
}

function titlePlain(props: any, key: string) {
  const t = props?.[key]?.title;
  if (!t || !t.length) return "";
  return t.map((x: any) => x?.plain_text || x?.text?.content || "").join("").trim();
}

function dateOnly(iso?: string | null) {
  return iso ? iso.split("T")[0] : null;
}

function artIso(dateOnlyStr: string, time: "14:00:00" | "18:00:00") {
  return new Date(`${dateOnlyStr}T${time}-03:00`).toISOString();
}

function norm(s: string) {
  return (s || "").trim().toLowerCase();
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
}

Deno.serve(async (req) => {
  const base44 = getBase44(req);

  const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");
  const databaseId = Deno.env.get("NOTION_DATABASE_ID");
  if (!databaseId) return Response.json({ error: "NOTION_DATABASE_ID no configurado" }, { status: 500 });

  // Traer alojamientos Base44 para mapear por nombre
  const acc = await base44.asServiceRole.entities.Accommodation.list({ limit: 200 });
  const accommodations = acc.items || [];

  // Map rápido name->id
  const accByName = new Map<string, any>();
  for (const a of accommodations) accByName.set(norm(a.name), a);

  const statusMap: Record<string, string> = {
    Pendiente: "pending",
    Pago: "confirmed",
    Cancelada: "cancelled",
    Completa: "completed",
  };

  const created: any[] = [];
  const debug_skipped: any[] = [];

  let startCursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    // 🔧 OJO: si sospechás que el filtro no matchea, podés comentar el "filter"
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
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
        filter: {
          property: "BookingID44",
          rich_text: { is_empty: true },
        },
      }),
    });

    if (!notionRes.ok) {
      return Response.json({ error: "Notion query failed", details: await notionRes.text() }, { status: notionRes.status });
    }

    const data = await notionRes.json();

    for (const page of data.results || []) {
      const props = page.properties || {};

      // ✅ Verificación fuerte: si BookingID44 tiene algo, no lo importamos
      const bookingId44 = rtPlain(props, "BookingID44");
      if (bookingId44) {
        debug_skipped.push({ page_id: page.id, reason: "BookingID44 ya existe", bookingId44 });
        continue;
      }

      // Cabaña / Casa (multi_select)
      const ms = props["Cabaña / Casa"]?.multi_select || [];
      const accommodationName = (ms[0]?.name || "").trim();
      if (!accommodationName) {
        debug_skipped.push({ page_id: page.id, reason: "Falta Cabaña / Casa" });
        continue;
      }

      // Date range
      const range = props["Check-In / Check-Out"]?.date;
      const inDay = dateOnly(range?.start);
      const outDay = dateOnly(range?.end);
      if (!inDay || !outDay) {
        debug_skipped.push({
          page_id: page.id,
          reason: "Falta rango Check-In / Check-Out (start o end)",
          got: { start: range?.start, end: range?.end },
        });
        continue;
      }

      // Mapear alojamiento por nombre (normalizado)
      const acc = accByName.get(norm(accommodationName));
      if (!acc) {
        debug_skipped.push({
          page_id: page.id,
          reason: "No matchea nombre de alojamiento con Base44",
          accommodationName,
          base44AccommodationNames: accommodations.map((a: any) => a.name),
        });
        continue;
      }

      // Otros campos
      const guestName = titlePlain(props, "Nombre del huésped");
      const guestEmail = props["Email"]?.email || "";
      const guestPhone = rtPlain(props, "Teléfono / WhatsApp");
      const notes = rtPlain(props, "Notas");
      const guests = props["Cant. huéspedes"]?.number ?? 0;
      const total = props["Monto total"]?.number ?? 0;

      const notionStatus = props["Estado de la reserva"]?.select?.name || "Pendiente";
      const mappedStatus = statusMap[notionStatus] || "pending";

      // Crear booking en Base44
      const booking = await base44.asServiceRole.entities.Booking.create({
        accommodation_id: acc.id,
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

      created.push({ notion_page_id: page.id, booking_id: booking.id, accommodation_id: acc.id });
    }

    hasMore = Boolean(data.has_more);
    startCursor = data.next_cursor || undefined;
  }

  return Response.json({
    success: true,
    mode: "import",
    created: created.length,
    items: created,
    debug_skipped_sample: debug_skipped.slice(0, 20),
    skipped_count: debug_skipped.length,
  });
});