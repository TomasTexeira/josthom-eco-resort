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

function plainFromRichText(prop: any): string {
  const arr = prop?.rich_text;
  if (!arr?.length) return "";
  return arr.map((x: any) => x?.plain_text || x?.text?.content || "").join("").trim();
}

function plainFromTitle(prop: any): string {
  const arr = prop?.title;
  if (!arr?.length) return "";
  return arr.map((x: any) => x?.plain_text || x?.text?.content || "").join("").trim();
}

function toISO(dateYYYYMMDD: string, time: string) {
  const dt = new Date(`${dateYYYYMMDD}T${time}`);
  return dt.toISOString();
}

async function notionQueryNew(databaseId: string, accessToken: string) {
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

  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

async function notionPatch(pageId: string, accessToken: string, properties: any) {
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
  return await res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = getBase44(req);

    const databaseId = Deno.env.get("NOTION_DATABASE_ID");
    if (!databaseId) return Response.json({ error: "NOTION_DATABASE_ID no configurado" }, { status: 500 });

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");

    const statusMap: Record<string, string> = {
      Pendiente: "pending",
      Pago: "confirmed",
      Cancelada: "cancelled",
      Completa: "completed",
    };

    const notionData = await notionQueryNew(databaseId, accessToken);

    const created: any[] = [];
    const skipped: any[] = [];

    for (const page of notionData.results || []) {
      const props = page.properties || {};

      const bookingId44 = plainFromRichText(props["BookingID44"]);
      if (bookingId44) {
        skipped.push({ page_id: page.id, reason: "Ya tiene BookingID44" });
        continue;
      }

      // CLAVE: NO LISTAMOS Accommodation. Leemos el ID directo desde Notion.
      const accommodationId44 = plainFromRichText(props["AccommodationID44"]);
      if (!accommodationId44) {
        skipped.push({ page_id: page.id, reason: "Falta AccommodationID44 (no se puede crear booking)" });
        continue;
      }

      const guest_name = plainFromTitle(props["Nombre del huésped"]);
      const guest_phone = plainFromRichText(props["Teléfono / WhatsApp"]);
      const guest_email = props["Email"]?.email || "";
      const number_of_guests = props["Cant. huéspedes"]?.number ?? 0;
      const total_price = props["Monto total"]?.number ?? 0;
      const special_requests = plainFromRichText(props["Notas"]);

      const notionStatus = props["Estado de la reserva"]?.select?.name || "Pendiente";
      const status = statusMap[notionStatus] || "pending";

      const range = props["Check-In / Check-Out"]?.date;
      const start = range?.start?.split("T")[0];
      const end = range?.end?.split("T")[0];

      if (!start || !end) {
        skipped.push({ page_id: page.id, reason: "Falta rango Check-In / Check-Out" });
        continue;
      }

      const check_in = toISO(start, CHECKIN_TIME);
      const check_out = toISO(end, CHECKOUT_TIME);

      // Crear booking en Base44
      const newBooking = await base44.asServiceRole.entities.Booking.create({
        accommodation_id: accommodationId44,
        guest_name,
        guest_phone,
        guest_email,
        number_of_guests,
        total_price,
        special_requests,
        status,
        check_in,
        check_out,
      });

      // Guardar BookingID44 en Notion
      await notionPatch(page.id, accessToken, {
        BookingID44: { rich_text: [{ text: { content: newBooking.id } }] },
      });

      created.push({ page_id: page.id, booking_id: newBooking.id, accommodation_id: accommodationId44 });
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
    return Response.json({ success: false, error: String(error?.message || error) }, { status: 500 });
  }
});