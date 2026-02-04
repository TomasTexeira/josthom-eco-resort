import { createClient, createClientFromRequest } from "npm:@base44/sdk@0.8.6";

const NOTION_VERSION = "2022-06-28";
const CHECKIN_TIME = "14:00:00-03:00";
const CHECKOUT_TIME = "18:00:00-03:00";

function getBase44(req: Request) {
  try {
    return createClientFromRequest(req);
  } catch {
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

function emailPlain(props: any, key: string) {
  return (props?.[key]?.email || "").trim();
}

function numPlain(props: any, key: string) {
  const n = props?.[key]?.number;
  return typeof n === "number" ? n : 0;
}

function selectName(props: any, key: string) {
  return (props?.[key]?.select?.name || "").trim();
}

function dateRange(props: any, key: string) {
  const d = props?.[key]?.date;
  return { start: d?.start || "", end: d?.end || "" };
}

function toISOWithFixedTime(dateYYYYMMDD: string, time: string) {
  // dateYYYYMMDD = "2026-02-04"
  // time = "14:00:00-03:00"
  // produce ISO string
  const dt = new Date(`${dateYYYYMMDD}T${time}`);
  return dt.toISOString();
}

async function notionQueryNew(databaseId: string, accessToken: string) {
  // Busca páginas SIN BookingID44 (nuevas manuales)
  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      page_size: 50,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
      filter: {
        property: "BookingID44",
        rich_text: { is_empty: true },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Notion query failed: ${await res.text()}`);
  }
  return await res.json();
}

async function notionSetBookingId(pageId: string, databaseId: string, accessToken: string, bookingId44: string) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      properties: {
        "BookingID44": {
          rich_text: [{ text: { content: bookingId44 } }],
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Notion update failed (${pageId}): ${await res.text()}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = getBase44(req);

    const databaseId = Deno.env.get("NOTION_DATABASE_ID");
    if (!databaseId) return Response.json({ error: "NOTION_DATABASE_ID no configurado" }, { status: 500 });

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");

    const notionData = await notionQueryNew(databaseId, accessToken);

    const statusMap: Record<string, string> = {
      "Pendiente": "pending",
      "Pago": "confirmed",
      "Cancelada": "cancelled",
      "Completa": "completed",
    };

    const created: any[] = [];
    const skipped: any[] = [];

    for (const page of notionData.results || []) {
      const props = page.properties || {};

      // Si ya tuviera BookingID44, no debería entrar por el filtro, pero por las dudas:
      const bookingId44 = rtPlain(props, "BookingID44");
      if (bookingId44) {
        skipped.push({ page_id: page.id, reason: "Ya tiene BookingID44" });
        continue;
      }

      // ESTE ES EL PUNTO CLAVE: no hacemos Accommodation.list(), usamos AccommodationID44
      const accommodationId44 = rtPlain(props, "AccommodationID44");
      if (!accommodationId44) {
        skipped.push({ page_id: page.id, reason: "Falta AccommodationID44 (no se puede crear booking sin eso)" });
        continue;
      }

      const guest_name = titlePlain(props, "Nombre del huésped");
      const guest_phone = rtPlain(props, "Teléfono / WhatsApp");
      const guest_email = emailPlain(props, "Email");
      const number_of_guests = numPlain(props, "Cant. huéspedes");
      const total_price = numPlain(props, "Monto total");
      const special_requests = rtPlain(props, "Notas");

      const notionStatus = selectName(props, "Estado de la reserva");
      const mappedStatus = statusMap[notionStatus] || "pending";

      const range = dateRange(props, "Check-In / Check-Out");
      if (!range.start || !range.end) {
        skipped.push({ page_id: page.id, reason: "Falta rango Check-In / Check-Out" });
        continue;
      }

      // Forzamos horas (14:00 check-in / 18:00 check-out ART)
      const check_in = toISOWithFixedTime(range.start.split("T")[0], CHECKIN_TIME);
      const check_out = toISOWithFixedTime(range.end.split("T")[0], CHECKOUT_TIME);

      // Crear booking en Base44
      // Nota: ajustá nombres de campos a tu entidad Booking real si difieren.
      const newBooking = await base44.asServiceRole.entities.Booking.create({
        accommodation_id: accommodationId44,
        guest_name,
        guest_phone,
        guest_email,
        number_of_guests,
        total_price,
        special_requests,
        status: mappedStatus,
        check_in,
        check_out,
      });

      // Escribir BookingID44 en Notion
      await notionSetBookingId(page.id, databaseId, accessToken, newBooking.id);

      created.push({
        page_id: page.id,
        booking_id: newBooking.id,
        accommodation_id: accommodationId44,
      });
    }

    return Response.json({
      success: true,
      mode: "import",
      created: created.length,
      items: created,
      skipped_count: skipped.length,
      skipped_sample: skipped.slice(0, 10),
    });
  } catch (error) {
    return Response.json({ error: String(error?.message || error) }, { status: 500 });
  }
});