import { createClient, createClientFromRequest } from "npm:@base44/sdk@0.8.6";

const NOTION_VERSION = "2022-06-28";

// =====================
// Base44 client (manual + automation)
// =====================
function getBase44(req: Request) {
  try {
    return createClientFromRequest(req); // manual via HTTP
  } catch {
    const token = Deno.env.get("BASE44_SERVICE_ROLE_TOKEN");
    if (!token) throw new Error("Missing env var: BASE44_SERVICE_ROLE_TOKEN");
    return createClient({ token }); // cron automation
  }
}

// =====================
// Helpers Notion parsing
// =====================
function readTitle(props: any, key: string) {
  const arr = props?.[key]?.title;
  if (!arr?.length) return null;
  return arr.map((t: any) => t?.plain_text ?? t?.text?.content ?? "").join("").trim() || null;
}

function readRichText(props: any, key: string) {
  const arr = props?.[key]?.rich_text;
  if (!arr?.length) return null;
  return arr.map((t: any) => t?.plain_text ?? t?.text?.content ?? "").join("").trim() || null;
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
  if (!iso) return null;
  return iso.split("T")[0];
}

// Notion might store date or datetime.
// We compare by day, but we always WRITE with fixed times ART.
function artIso(dateOnlyStr: string, time: "14:00:00" | "18:00:00") {
  return new Date(`${dateOnlyStr}T${time}-03:00`).toISOString();
}

function normStr(s?: string | null) {
  return (s ?? "").trim().toLowerCase();
}

// =====================
// Overlap check (recommended)
// If you don't want this, you can remove validateOverlap + calls.
// =====================
function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  // overlap if start < otherEnd AND end > otherStart
  return new Date(aStart).getTime() < new Date(bEnd).getTime() &&
         new Date(aEnd).getTime() > new Date(bStart).getTime();
}

async function validateNoOverlap(base44: any, bookingId: string, accommodationId: string, checkInIso: string, checkOutIso: string) {
  // List bookings for same accommodation that are not cancelled.
  // NOTE: some Base44 apps expose different filter syntaxes; if your list() supports filters, use them.
  // This "safe" approach pulls a page and filters in-memory.
  const list = await base44.asServiceRole.entities.Booking.list({ limit: 200 }).catch(() => []);
  const relevant = (list || []).filter((b: any) =>
    b?.accommodation_id === accommodationId &&
    b?.id !== bookingId &&
    b?.status !== "cancelled" &&
    b?.check_in && b?.check_out
  );

  const conflict = relevant.find((b: any) => overlaps(checkInIso, checkOutIso, b.check_in, b.check_out));
  if (conflict) {
    return { ok: false, conflictBookingId: conflict.id };
  }
  return { ok: true };
}

// =====================
// Main
// =====================
Deno.serve(async (req) => {
  try {
    const base44 = getBase44(req);

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");
    const databaseId = Deno.env.get("NOTION_DATABASE_ID");
    if (!databaseId) return Response.json({ error: "NOTION_DATABASE_ID no configurado" }, { status: 500 });

    // Notion -> Base44 status mapping
    const statusMap: Record<string, "pending" | "confirmed" | "cancelled" | "completed"> = {
      Pendiente: "pending",
      Pago: "confirmed",
      Cancelada: "cancelled",
      Completa: "completed",
    };

    // Cache accommodations once (so we can map "Cabaña 1" -> accommodation.id)
    const accommodations = await base44.asServiceRole.entities.Accommodation.list({ limit: 100 }).catch(() => []);
    const accByName = new Map<string, any>();
    for (const a of (accommodations || [])) {
      if (a?.name) accByName.set(normStr(a.name), a);
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

        // ID del booking en Base44 (guardado en Notion)
        const bookingId = readRichText(props, "BookingID44");
        if (!bookingId) continue;

        // Datos Notion
        const guestName = readTitle(props, "Nombre del huésped");
        const guestPhone = readRichText(props, "Teléfono / WhatsApp");
        const guestEmail = readEmail(props, "Email");
        const specialRequests = readRichText(props, "Notas");
        const numberOfGuests = readNumber(props, "Cant. huéspedes");
        const totalPrice = readNumber(props, "Monto total");

        const notionStatusName = readSelect(props, "Estado de la reserva");
        const mappedStatus = notionStatusName ? statusMap[notionStatusName] : null;

        const accommodationName = readFirstMultiSelectName(props, "Cabaña / Casa");
        const acc = accommodationName ? accByName.get(normStr(accommodationName)) : null;

        const range = props["Check-In / Check-Out"]?.date;
        const nInDay = dateOnly(range?.start);
        const nOutDay = dateOnly(range?.end);

        // Booking actual en Base44
        const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
        if (!booking) {
          debug.push({ notion_page_id: page.id, bookingId, reason: "BookingID44 no existe en Base44" });
          continue;
        }

        // Preparar update
        const updateData: Record<string, any> = {};
        let changed = false;

        // 1) status
        if (mappedStatus && booking.status !== mappedStatus) {
          updateData.status = mappedStatus;
          changed = true;
        }

        // 2) huésped
        if (guestName != null && booking.guest_name !== guestName) {
          updateData.guest_name = guestName;
          changed = true;
        }
        if (guestPhone != null && booking.guest_phone !== guestPhone) {
          updateData.guest_phone = guestPhone;
          changed = true;
        }
        if (guestEmail != null && booking.guest_email !== guestEmail) {
          updateData.guest_email = guestEmail;
          changed = true;
        }

        // 3) notas
        if (specialRequests != null && booking.special_requests !== specialRequests) {
          updateData.special_requests = specialRequests;
          changed = true;
        }

        // 4) cantidad huéspedes / precio
        if (numberOfGuests != null && booking.number_of_guests !== numberOfGuests) {
          updateData.number_of_guests = numberOfGuests;
          changed = true;
        }
        if (totalPrice != null && booking.total_price !== totalPrice) {
          updateData.total_price = totalPrice;
          changed = true;
        }

        // 5) cabaña (accommodation_id)
        if (accommodationName && !acc) {
          debug.push({
            notion_page_id: page.id,
            bookingId,
            reason: "No matchea nombre de alojamiento con Base44",
            accommodationName,
            base44AccommodationNames: [...accByName.values()].map((a: any) => a.name),
          });
        } else if (acc && booking.accommodation_id !== acc.id) {
          updateData.accommodation_id = acc.id;
          changed = true;
        }

        // 6) fechas (siempre guardar con horas fijas ART)
        if (nInDay && nOutDay) {
          const desiredIn = artIso(nInDay, "14:00:00");
          const desiredOut = artIso(nOutDay, "18:00:00");

          // Comparación: por día (evita líos de timezone)
          const bInDay = dateOnly(booking.check_in);
          const bOutDay = dateOnly(booking.check_out);

          if (bInDay !== nInDay || bOutDay !== nOutDay) {
            updateData.check_in = desiredIn;
            updateData.check_out = desiredOut;
            changed = true;
          }

          // ✅ Validar solapamiento si cambiaron fechas o cabaña
          // (solo si no está cancelada)
          const nextStatus = updateData.status ?? booking.status;
          const nextAccId = updateData.accommodation_id ?? booking.accommodation_id;
          const nextIn = updateData.check_in ?? booking.check_in;
          const nextOut = updateData.check_out ?? booking.check_out;

          if (changed && nextStatus !== "cancelled" && nextAccId && nextIn && nextOut) {
            const ok = await validateNoOverlap(base44, booking.id, nextAccId, nextIn, nextOut);
            if (!ok.ok) {
              // No aplicamos el update para no romper disponibilidad
              debug.push({
                notion_page_id: page.id,
                bookingId,
                reason: "Superposición detectada: no se actualiza",
                conflictBookingId: ok.conflictBookingId,
                attempted: { nextAccId, nextIn, nextOut },
              });
              continue;
            }
          }
        }

        // 7) aplicar update
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
      debug_sample: debug.slice(0, 20),
      base44_accommodations_count: accommodations?.length ?? 0,
    });
  } catch (error) {
    return Response.json({ error: String((error as any)?.message || error) }, { status: 500 });
  }
});