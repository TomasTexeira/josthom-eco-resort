// functions/syncNotionChanges.ts
import { createClient, createClientFromRequest } from "npm:@base44/sdk@0.8.6";

const NOTION_VERSION = "2022-06-28";

function getBase44(req: Request) {
  // ✅ Soporta ejecución manual (HTTP) y automatizaciones (cron) donde no hay request “real”
  try {
    return createClientFromRequest(req);
  } catch {
    const token = Deno.env.get("BASE44_SERVICE_ROLE_TOKEN");
    if (!token) throw new Error("Missing env var: BASE44_SERVICE_ROLE_TOKEN");
    return createClient({ token });
  }
}

// ---------- Notion helpers ----------
function readRichText(props: any, key: string) {
  const rt = props?.[key]?.rich_text;
  if (!rt || !rt.length) return null;
  return rt[0]?.plain_text || rt[0]?.text?.content || null;
}

function readTitle(props: any, key: string) {
  const t = props?.[key]?.title;
  if (!t || !t.length) return null;
  return t[0]?.plain_text || t[0]?.text?.content || null;
}

function readEmail(props: any, key: string) {
  return props?.[key]?.email ?? null;
}

function readNumber(props: any, key: string) {
  const n = props?.[key]?.number;
  return typeof n === "number" ? n : null;
}

function readSelectName(props: any, key: string) {
  return props?.[key]?.select?.name ?? null;
}

function dateOnly(iso?: string | null) {
  return iso ? iso.split("T")[0] : null;
}

function artIso(dateOnlyStr: string, time: "14:00:00" | "18:00:00") {
  // ✅ Fuerza horario ART (UTC-3) y devuelve ISO UTC (toISOString)
  return new Date(`${dateOnlyStr}T${time}-03:00`).toISOString();
}

// Normalize values for safe comparisons
function normStr(v: any) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

// Notion "Cabaña / Casa" es multi_select -> agarramos el primer item
function readFirstMultiSelectName(props: any, key: string) {
  const ms = props?.[key]?.multi_select;
  if (!ms || !ms.length) return null;
  return ms[0]?.name ?? null;
}

// ---------- Handler ----------
Deno.serve(async (req) => {
  try {
    const base44 = getBase44(req);

    // Notion auth + DB
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");
    const databaseId = Deno.env.get("NOTION_DATABASE_ID");
    if (!databaseId) {
      return Response.json({ success: false, error: "NOTION_DATABASE_ID no configurado" }, { status: 500 });
    }

    // Map Notion -> Base44
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
          // ✅ Solo páginas que tengan BookingID44 (ID del booking en Base44)
          filter: {
            property: "BookingID44",
            rich_text: { is_not_empty: true },
          },
        }),
      });

      if (!notionResponse.ok) {
        const text = await notionResponse.text();
        return Response.json(
          { success: false, error: "Error consultando Notion", details: text },
          { status: notionResponse.status },
        );
      }

      const notionData = await notionResponse.json();

      for (const page of notionData.results || []) {
        const props = page.properties || {};

        // ✅ ID del booking en Base44 guardado en Notion
        const bookingId = normStr(readRichText(props, "BookingID44"));
        if (!bookingId) continue;

        // Notion fields
        const notionStatusName = readSelectName(props, "Estado de la reserva");
        const mappedStatus = notionStatusName ? statusMap[notionStatusName] : null;

        const range = props["Check-In / Check-Out"]?.date;
        const nIn = dateOnly(range?.start);
        const nOut = dateOnly(range?.end);

        const guestName = normStr(readTitle(props, "Nombre del huésped"));
        const guestPhone = normStr(readRichText(props, "Teléfono / WhatsApp"));
        const guestEmail = normStr(readEmail(props, "Email"));
        const specialRequests = normStr(readRichText(props, "Notas"));
        const numberOfGuests = readNumber(props, "Cant. huéspedes");
        const totalPrice = readNumber(props, "Monto total");

        // (opcional) leer alojamiento desde Notion si querés validar consistencia
        const notionAccommodationName = normStr(readFirstMultiSelectName(props, "Cabaña / Casa"));

        // Get booking by ID in Base44
        const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
        if (!booking) {
          debug.push({ notion_page_id: page.id, bookingId, reason: "BookingID44 no existe en Base44" });
          continue;
        }

        // Compare booking current values
        const bIn = dateOnly(booking.check_in);
        const bOut = dateOnly(booking.check_out);

        const updateData: Record<string, any> = {};
        let changed = false;

        // status
        if (mappedStatus && booking.status !== mappedStatus) {
          updateData.status = mappedStatus;
          changed = true;
        }

        // dates (compare by date-only)
        if (nIn && nOut && (nIn !== bIn || nOut !== bOut)) {
          updateData.check_in = artIso(nIn, "14:00:00");
          updateData.check_out = artIso(nOut, "18:00:00");
          changed = true;
        }

        // guests
        if (numberOfGuests !== null && booking.number_of_guests !== numberOfGuests) {
          updateData.number_of_guests = numberOfGuests;
          changed = true;
        }

        // total price
        if (totalPrice !== null && booking.total_price !== totalPrice) {
          updateData.total_price = totalPrice;
          changed = true;
        }

        // Guest data (si tus campos existen en Booking; si no existen, Base44 fallará aquí)
        if (guestName && booking.guest_name !== guestName) {
          updateData.guest_name = guestName;
          changed = true;
        }
        if (guestPhone && booking.guest_phone !== guestPhone) {
          updateData.guest_phone = guestPhone;
          changed = true;
        }
        if (guestEmail && booking.guest_email !== guestEmail) {
          updateData.guest_email = guestEmail;
          changed = true;
        }
        if (specialRequests && booking.special_requests !== specialRequests) {
          updateData.special_requests = specialRequests;
          changed = true;
        }

        // (opcional) sanity check: no actualiza accommodation_id, solo deja debug
        if (notionAccommodationName && booking.accommodation_name && notionAccommodationName !== booking.accommodation_name) {
          debug.push({
            notion_page_id: page.id,
            bookingId,
            reason: "Nombre de alojamiento difiere (solo debug, no actualizo accommodation)",
            notionAccommodationName,
            base44AccommodationName: booking.accommodation_name,
          });
        }

        if (changed) {
          await base44.asServiceRole.entities.Booking.update(booking.id, updateData);
          updates.push({ booking_id: booking.id, notion_page_id: page.id, changes: updateData });
        } else {
          debug.push({
            notion_page_id: page.id,
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

    return Response.json({
      success: true,
      synced: updates.length,
      updates,
      debug_sample: debug.slice(0, 25),
    });
  } catch (error) {
    return Response.json({ success: false, error: String(error?.message || error) }, { status: 500 });
  }
});