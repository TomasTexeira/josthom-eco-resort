import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

const NOTION_VERSION = "2022-06-28";

// ====== Notion fields (ajustá si cambias nombres) ======
const NOTION_FIELD_BOOKING_ID = "BookingID44"; // rich_text
const NOTION_FIELD_ACCOMMODATION = "Cabaña / Casa"; // multi_select
const NOTION_FIELD_DATERANGE = "Check-In / Check-Out"; // date range
const NOTION_FIELD_GUEST_NAME = "Nombre del huésped"; // title
const NOTION_FIELD_GUEST_PHONE = "Teléfono / WhatsApp"; // rich_text
const NOTION_FIELD_GUEST_EMAIL = "Email"; // email
const NOTION_FIELD_GUESTS = "Cant. huéspedes"; // number
const NOTION_FIELD_TOTAL = "Monto total"; // number
const NOTION_FIELD_NOTES = "Notas"; // rich_text
const NOTION_FIELD_STATUS = "Estado de la reserva"; // select (Pendiente/Pago/Cancelada/Completa)

// ====== Status mapping ======
const statusMap: Record<string, string> = {
  Pendiente: "pending",
  Pago: "confirmed",
  Cancelada: "cancelled",
  Completa: "completed",
};

// ====== Helpers ======
function json(resBody: unknown, status = 200) {
  return Response.json(resBody, { status });
}

function pickNotionText(prop: any): string {
  // title / rich_text
  if (!prop) return "";
  if (prop.title?.length) return prop.title.map((t: any) => t.plain_text).join("").trim();
  if (prop.rich_text?.length) return prop.rich_text.map((t: any) => t.plain_text).join("").trim();
  return "";
}

function pickNotionEmail(prop: any): string {
  return prop?.email || "";
}

function pickNotionNumber(prop: any): number {
  const n = prop?.number;
  return typeof n === "number" ? n : 0;
}

function pickNotionSelect(prop: any): string {
  return prop?.select?.name || "";
}

function pickNotionMultiSelectFirst(prop: any): string {
  // multi_select: [{name:"Cabaña 1"}]
  const ms = prop?.multi_select;
  if (Array.isArray(ms) && ms.length > 0) return ms[0]?.name || "";
  return "";
}

function normalizeName(s: string) {
  return (s || "").trim().toLowerCase();
}

function toISOWithART(dateOnlyOrISO: string, hhmm: "14:00" | "18:00"): string {
  // If Notion gives "YYYY-MM-DD" or full ISO, we only care date part
  const datePart = (dateOnlyOrISO || "").split("T")[0];
  // ART -03:00
  const iso = new Date(`${datePart}T${hhmm}:00-03:00`).toISOString();
  return iso;
}

async function notionQuery(notionToken: string, databaseId: string) {
  // Only pages where BookingID44 is empty (manual Notion booking)
  const body = {
    filter: {
      property: NOTION_FIELD_BOOKING_ID,
      rich_text: { is_empty: true },
    },
    sorts: [
      { timestamp: "created_time", direction: "ascending" },
    ],
    page_size: 50,
  };

  const r = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Notion query failed: ${r.status} ${t}`);
  }
  return await r.json();
}

async function notionPatchBookingId(notionToken: string, pageId: string, bookingId: string) {
  const r = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      properties: {
        [NOTION_FIELD_BOOKING_ID]: {
          rich_text: [{ text: { content: String(bookingId) } }],
        },
      },
    }),
  });

  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Notion patch failed (${pageId}): ${r.status} ${t}`);
  }
}

async function base44ListEntities(appId: string, apiKey: string, entity: string) {
  const r = await fetch(`https://app.base44.com/api/apps/${appId}/entities/${entity}`, {
    headers: {
      api_key: apiKey,
      "Content-Type": "application/json",
    },
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Base44 list ${entity} failed: ${r.status} ${t}`);
  }
  return await r.json();
}

async function base44CreateBooking(appId: string, apiKey: string, payload: any) {
  const r = await fetch(`https://app.base44.com/api/apps/${appId}/entities/Booking`, {
    method: "POST",
    headers: {
      api_key: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Base44 create Booking failed: ${r.status} ${t}`);
  }
  return await r.json();
}

async function base44ListBookingsByAccommodation(appId: string, apiKey: string, accommodationId: string) {
  const r = await fetch(
    `https://app.base44.com/api/apps/${appId}/entities/Booking?accommodation_id=${encodeURIComponent(accommodationId)}`,
    {
      headers: {
        api_key: apiKey,
        "Content-Type": "application/json",
      },
    }
  );
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Base44 list Booking failed: ${r.status} ${t}`);
  }
  return await r.json();
}

function unwrapItems(anyListResponse: any): any[] {
  // Base44 sometimes returns {items:[...]} or {data:{items:[...]}} etc
  if (Array.isArray(anyListResponse?.items)) return anyListResponse.items;
  if (Array.isArray(anyListResponse?.data?.items)) return anyListResponse.data.items;
  if (Array.isArray(anyListResponse?.data)) return anyListResponse.data;
  return [];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const databaseId = Deno.env.get("NOTION_DATABASE_ID");
    const base44ApiKey = Deno.env.get("BASE44_API_KEY");
    const appId = Deno.env.get("BASE44_APP_ID");

    if (!databaseId) return json({ success: false, error: "Missing env var: NOTION_DATABASE_ID" }, 500);
    if (!base44ApiKey) return json({ success: false, error: "Missing env var: BASE44_API_KEY" }, 500);
    if (!appId) return json({ success: false, error: "Missing env var: BASE44_APP_ID" }, 500);

    // Notion token from connector
    const notionToken = await base44.asServiceRole.connectors.getAccessToken("notion");

    // 1) Fetch accommodations once (for name matching)
    let accommodations: any[] = [];
    let accommodationNames: string[] = [];

    try {
      const accRes = await base44ListEntities(appId, base44ApiKey, "Accommodation");
      accommodations = unwrapItems(accRes);
      accommodationNames = accommodations.map((a) => a?.name).filter(Boolean);
    } catch (e: any) {
      return json(
        { success: false, error: "No pude leer Accommodation entities", details: String(e?.message || e) },
        500
      );
    }

    // 2) Query Notion for pages without BookingID44
    const notionData = await notionQuery(notionToken, databaseId);
    const pages: any[] = Array.isArray(notionData?.results) ? notionData.results : [];

    const created: any[] = [];
    const deduped: any[] = [];
    const skipped: any[] = [];

    for (const page of pages) {
      const pageId = page?.id;
      const props = page?.properties || {};

      const guestName = pickNotionText(props[NOTION_FIELD_GUEST_NAME]);
      const guestPhone = pickNotionText(props[NOTION_FIELD_GUEST_PHONE]);
      const guestEmail = pickNotionEmail(props[NOTION_FIELD_GUEST_EMAIL]);
      const guests = pickNotionNumber(props[NOTION_FIELD_GUESTS]);
      const total = pickNotionNumber(props[NOTION_FIELD_TOTAL]);
      const notes = pickNotionText(props[NOTION_FIELD_NOTES]);

      const notionStatusLabel = pickNotionSelect(props[NOTION_FIELD_STATUS]);
      const mappedStatus = statusMap[notionStatusLabel] || "pending";

      const accommodationName = pickNotionMultiSelectFirst(props[NOTION_FIELD_ACCOMMODATION]);
      const dateRange = props[NOTION_FIELD_DATERANGE]?.date;
      const start = dateRange?.start;
      const end = dateRange?.end;

      if (!pageId) continue;

      if (!accommodationName) {
        skipped.push({ page_id: pageId, reason: "Falta Cabaña / Casa (multi_select)", guestName });
        continue;
      }
      if (!start || !end) {
        skipped.push({ page_id: pageId, reason: "Falta Check-In / Check-Out (start/end)", guestName, accommodationName });
        continue;
      }

      // Match accommodation by name
      const acc = accommodations.find((a) => normalizeName(a?.name) === normalizeName(accommodationName));
      if (!acc?.id) {
        skipped.push({
          page_id: pageId,
          reason: "No matchea nombre de alojamiento con Base44",
          accommodationName,
          base44AccommodationNames: accommodationNames,
        });
        continue;
      }

      // Build ISO dates with fixed times
      const checkInISO = toISOWithART(start, "14:00");
      const checkOutISO = toISOWithART(end, "18:00");

      // 3) Dedupe: if booking already exists in Base44 -> write BookingID44 and skip create
      let existingBooking: any = null;
      try {
        const bRes = await base44ListBookingsByAccommodation(appId, base44ApiKey, acc.id);
        const bookings = unwrapItems(bRes);

        existingBooking =
          bookings.find((b) => {
            if (!b) return false;
            if (String(b.status) === "cancelled") return false;
            return b.check_in === checkInISO && b.check_out === checkOutISO;
          }) || null;
      } catch (e) {
        // If list bookings fails, we proceed to create (better to create than to block everything)
      }

      if (existingBooking?.id) {
        await notionPatchBookingId(notionToken, pageId, String(existingBooking.id));
        deduped.push({
          page_id: pageId,
          accommodation_id: acc.id,
          accommodation_name: acc.name,
          base44_booking_id: existingBooking.id,
          action: "deduped_write_id",
        });
        continue;
      }

      // 4) Create booking in Base44
      const payload = {
        accommodation_id: acc.id,
        accommodation_name: acc.name,
        check_in: checkInISO,
        check_out: checkOutISO,
        guest_name: guestName || "",
        guest_phone: guestPhone || "",
        guest_email: guestEmail || "",
        number_of_guests: guests || 0,
        total_price: total || 0,
        special_requests: notes || "",
        status: mappedStatus,
      };

      const createdRes = await base44CreateBooking(appId, base44ApiKey, payload);
      const createdItems = unwrapItems(createdRes);
      const createdBooking = createdItems?.[0] ?? createdRes?.item ?? createdRes?.data ?? createdRes;

      const bookingId = createdBooking?.id;
      if (!bookingId) {
        skipped.push({ page_id: pageId, reason: "Base44 creó booking pero no devolvió id", payload });
        continue;
      }

      // 5) Write BookingID44 back to Notion
      await notionPatchBookingId(notionToken, pageId, String(bookingId));

      created.push({
        page_id: pageId,
        accommodation_id: acc.id,
        accommodation_name: acc.name,
        base44_booking_id: bookingId,
        check_in: checkInISO,
        check_out: checkOutISO,
        status: mappedStatus,
      });
    }

    return json({
      success: true,
      mode: "import",
      notion_fetched: pages.length,
      base44_accommodations: accommodationNames.length,
      created: created.length,
      deduped: deduped.length,
      skipped_count: skipped.length,
      created_items: created,
      deduped_items: deduped,
      debug_skipped_sample: skipped.slice(0, 10),
    });
  } catch (error: any) {
    return json({ success: false, error: String(error?.message || error) }, 500);
  }
});