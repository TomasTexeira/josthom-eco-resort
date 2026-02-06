import { createClient, createClientFromRequest } from "npm:@base44/sdk@0.8.6";

const NOTION_VERSION = "2022-06-28";

// -------------------- Base44 client (manual + automation) --------------------
function getBase44(req: Request) {
  try {
    return createClientFromRequest(req); // manual via HTTP
  } catch {
    const token = Deno.env.get("BASE44_SERVICE_ROLE_TOKEN");
    if (!token) throw new Error("Missing env var: BASE44_SERVICE_ROLE_TOKEN");
    return createClient({ token }); // cron automation
  }
}

// -------------------- Notion helpers --------------------
function readTitle(props: any, key: string) {
  const arr = props?.[key]?.title;
  if (!arr?.length) return null;
  const s = arr.map((t: any) => t?.plain_text ?? t?.text?.content ?? "").join("").trim();
  return s || null;
}
function readRichText(props: any, key: string) {
  const arr = props?.[key]?.rich_text;
  if (!arr?.length) return null;
  const s = arr.map((t: any) => t?.plain_text ?? t?.text?.content ?? "").join("").trim();
  return s || null;
}
function readEmail(props: any, key: string) {
  const v = props?.[key]?.email;
  return (typeof v === "string" && v.trim()) ? v.trim() : null;
}
function readNumber(props: any, key: string) {
  const v = props?.[key]?.number;
  return (typeof v === "number" && !Number.isNaN(v)) ? v : null;
}
function readSelect(props: any, key: string) {
  const v = props?.[key]?.select?.name;
  return (typeof v === "string" && v.trim()) ? v.trim() : null;
}
function readFirstMultiSelectName(props: any, key: string) {
  const arr = props?.[key]?.multi_select;
  if (!arr?.length) return null;
  const name = arr[0]?.name;
  return (typeof name === "string" && name.trim()) ? name.trim() : null;
}
function dateOnly(iso?: string | null) {
  return iso ? iso.split("T")[0] : null;
}
function artIso(dateOnlyStr: string, time: "14:00:00" | "18:00:00") {
  return new Date(`${dateOnlyStr}T${time}-03:00`).toISOString();
}
function norm(s?: string | null) {
  return (s ?? "").trim().toLowerCase();
}

// -------------------- Base44 REST read (fallback) --------------------
async function fetchAllAccommodationsViaRest() {
  const apiKey = Deno.env.get("BASE44_API_KEY");
  const appId = Deno.env.get("BASE44_APP_ID");
  if (!apiKey) throw new Error("Missing env var: BASE44_API_KEY");
  if (!appId) throw new Error("Missing env var: BASE44_APP_ID");

  const url = `https://app.base44.com/api/apps/${appId}/entities/Accommodation`;
  const res = await fetch(url, {
    headers: { api_key: apiKey, "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`REST Accommodation fetch failed (${res.status}): ${t}`);
  }
  const data = await res.json();

  // Base44 suele devolver { data: { items: [...] } } o { items: [...] }
  const items = data?.data?.items ?? data?.items ?? data?.data ?? [];
  return Array.isArray(items) ? items : [];
}

// -------------------- Main --------------------
Deno.serve(async (req) => {
  try {
    const base44 = getBase44(req);

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");
    const databaseId = Deno.env.get("NOTION_DATABASE_ID");
    if (!databaseId) return Response.json({ error: "NOTION_DATABASE_ID no configurado" }, { status: 500 });

    const statusMap: Record<string, "pending" | "confirmed" | "cancelled" | "completed"> = {
      Pendiente: "pending",
      Pago: "confirmed",
      Cancelada: "cancelled",
      Completa: "completed",
    };

    // 1) Intento SDK
    let accommodations: any[] = [];
    let accSource = "sdk";
    try {
      accommodations = await base44.asServiceRole.entities.Accommodation.list({ limit: 100 }).catch(() => []);
    } catch {
      accommodations = [];
    }

    // 2) Fallback REST si está vacío
    if (!accommodations?.length) {
      accommodations = await fetchAllAccommodationsViaRest();
      accSource = "rest";
    }

    const accByName = new Map<string, any>();
    for (const a of accommodations) {
      if (a?.name) accByName.set(norm(a.name), a);
    }

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
          filter: { property: "BookingID44", rich_text: { is_not_empty: true } },
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
        const bookingId = readRichText(props, "BookingID44");
        if (!bookingId) continue;

        const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
        if (!booking) {
          debug.push({ notion_page_id: page.id, bookingId, reason: "BookingID44 no existe en Base44" });
          continue;
        }

        // Notion values
        const guestName = readTitle(props, "Nombre del huésped");
        const guestPhone = readRichText(props, "Teléfono / WhatsApp");
        const guestEmail = readEmail(props, "Email");
        const specialRequests = readRichText(props, "Notas");
        const numberOfGuests = readNumber(props, "Cant. huéspedes");
        const totalPrice = readNumber(props, "Monto total");

        const notionStatusName = readSelect(props, "Estado de la reserva");
        const mappedStatus = notionStatusName ? statusMap[notionStatusName] : null;

        const accommodationName = readFirstMultiSelectName(props, "Cabaña / Casa");
        const acc = accommodationName ? accByName.get(norm(accommodationName)) : null;

        const range = props["Check-In / Check-Out"]?.date;
        const nInDay = dateOnly(range?.start);
        const nOutDay = dateOnly(range?.end);

        const updateData: Record<string, any> = {};
        let changed = false;

        // status
        if (mappedStatus && booking.status !== mappedStatus) {
          updateData.status = mappedStatus;
          changed = true;
        }

        // guest fields
        if (guestName != null && booking.guest_name !== guestName) { updateData.guest_name = guestName; changed = true; }
        if (guestPhone != null && booking.guest_phone !== guestPhone) { updateData.guest_phone = guestPhone; changed = true; }
        if (guestEmail != null && booking.guest_email !== guestEmail) { updateData.guest_email = guestEmail; changed = true; }
        if (specialRequests != null && booking.special_requests !== specialRequests) { updateData.special_requests = specialRequests; changed = true; }

        // numbers
        if (numberOfGuests != null && booking.number_of_guests !== numberOfGuests) { updateData.number_of_guests = numberOfGuests; changed = true; }
        if (totalPrice != null && booking.total_price !== totalPrice) { updateData.total_price = totalPrice; changed = true; }

        // accommodation
        if (accommodationName && !acc) {
          debug.push({
            notion_page_id: page.id,
            bookingId,
            reason: "No matchea nombre de alojamiento con Base44",
            accommodationName,
            base44AccommodationNames: accommodations.map((a: any) => a?.name).filter(Boolean),
            acc_source: accSource,
            acc_count: accommodations.length,
          });
        } else if (acc && booking.accommodation_id !== acc.id) {
          updateData.accommodation_id = acc.id;
          changed = true;
        }

        // dates (ART fixed times)
        if (nInDay && nOutDay) {
          const bInDay = dateOnly(booking.check_in);
          const bOutDay = dateOnly(booking.check_out);
          if (bInDay !== nInDay || bOutDay !== nOutDay) {
            updateData.check_in = artIso(nInDay, "14:00:00");
            updateData.check_out = artIso(nOutDay, "18:00:00");
            changed = true;
          }
        }

        if (changed) {
          await base44.asServiceRole.entities.Booking.update(booking.id, updateData);
          updates.push({ booking_id: booking.id, notion_page_id: page.id, changes: updateData });
        } else {
          debug.push({ notion_page_id: page.id, bookingId, reason: "Sin cambios" });
        }
      }

      hasMore = Boolean(notionData.has_more);
      startCursor = notionData.next_cursor || undefined;
    }

    return Response.json({
      success: true,
      synced: updates.length,
      updates,
      debug_sample: debug.slice(0, 30),
      base44_accommodations_count: accommodations.length,
      accommodations_source: accSource,
    });

  } catch (error) {
    return Response.json({ error: String((error as any)?.message || error) }, { status: 500 });
  }
});