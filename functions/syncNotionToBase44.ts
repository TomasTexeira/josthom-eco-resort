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

function readTitle(props: any, key: string) {
  const t = props?.[key]?.title;
  if (!t || !t.length) return null;
  return t[0]?.plain_text || t[0]?.text?.content || null;
}

function readRichText(props: any, key: string) {
  const rt = props?.[key]?.rich_text;
  if (!rt || !rt.length) return null;
  return rt[0]?.plain_text || rt[0]?.text?.content || null;
}

function readMultiSelectName(props: any, key: string) {
  const ms = props?.[key]?.multi_select;
  if (!ms || !ms.length) return null;
  return ms[0]?.name || null;
}

function dateOnly(iso?: string | null) {
  return iso ? iso.split("T")[0] : null;
}

function artIso(dateOnlyStr: string, time: "14:00:00" | "18:00:00") {
  return new Date(`${dateOnlyStr}T${time}-03:00`).toISOString();
}

async function notionSetBookingId(accessToken: string, pageId: string, bookingId: string) {
  const patch = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      properties: {
        BookingID44: { rich_text: [{ text: { content: bookingId } }] },
      },
    }),
  });

  if (!patch.ok) return { ok: false, details: await patch.text() };
  return { ok: true, details: null };
}

async function listAccommodations(base44: any) {
  const res: any = await base44.asServiceRole.entities.Accommodation.list({ limit: 200 });
  const items: any[] = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
  return items;
}

async function getOrCreateAccommodationByName(base44: any, name: string) {
  const all = await listAccommodations(base44);
  const found = all.find((a: any) => (a?.name || "").trim() === name.trim());
  if (found) return { ok: true, accommodation: found, created: false, error: null };

  // Crear con los campos requeridos: name, type, capacity
  try {
    const created = await base44.asServiceRole.entities.Accommodation.create({ 
      name,
      type: "cabaña", // Valor por defecto
      capacity: 5 // Valor por defecto
    });
    return { ok: true, accommodation: created, created: true, error: null };
  } catch (e) {
    return { ok: false, accommodation: null, created: false, error: String(e) };
  }
}

async function findBookingByNotionPageId(base44: any, notionPageId: string) {
  // Si NO tenés notion_page_id en Booking, decímelo y lo hacemos dedupe por (accommodation_id + dates + email)
  try {
    const res: any = await base44.asServiceRole.entities.Booking.list({
      limit: 1,
      filter: { notion_page_id: notionPageId },
      sort: { created_date: -1 },
    });
    const items: any[] = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
    return items[0] || null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = getBase44(req);

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");
    const databaseId = Deno.env.get("NOTION_DATABASE_ID");
    if (!databaseId) return Response.json({ success: false, error: "NOTION_DATABASE_ID no configurado" }, { status: 500 });

    const statusMap: Record<string, string> = {
      Pendiente: "pending",
      Pago: "confirmed",
      Cancelada: "cancelled",
      Completa: "completed",
    };

    // Buscar páginas nuevas (sin BookingID44)
    const notionResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VERSION,
      },
      body: JSON.stringify({
        page_size: 50,
        filter: { property: "BookingID44", rich_text: { is_empty: true } },
        sorts: [{ timestamp: "created_time", direction: "ascending" }],
      }),
    });

    if (!notionResponse.ok) {
      return Response.json({ success: false, error: "Error consultando Notion", details: await notionResponse.text() }, { status: notionResponse.status });
    }

    const notionData = await notionResponse.json();

    let created = 0;
    let deduped = 0;
    let skipped_count = 0;

    const created_items: any[] = [];
    const deduped_items: any[] = [];
    const debug_skipped_sample: any[] = [];

    // para debug
    const base44Acc = await listAccommodations(base44);
    const base44AccNames = base44Acc.map((x: any) => x?.name).filter(Boolean);

    for (const page of notionData.results || []) {
      const props = page.properties || {};

      // Dedupe fuerte por notion_page_id (si existe en schema)
      const existing = await findBookingByNotionPageId(base44, page.id);
      if (existing?.id) {
        const patched = await notionSetBookingId(accessToken, page.id, existing.id);
        deduped++;
        deduped_items.push({ notion_page_id: page.id, booking_id: existing.id, patched: patched.ok, patch_error: patched.details });
        continue;
      }

      const guestName =
        readTitle(props, "Nombre del huésped") ||
        readRichText(props, "Nombre del huésped") ||
        "Sin nombre";

      const email = props["Email"]?.email || "";
      const phone = readRichText(props, "Teléfono / WhatsApp") || "";
      const notes = readRichText(props, "Notas") || "";
      const total = props["Monto total"]?.number ?? 0;
      const guests = props["Cant. huéspedes"]?.number ?? 0;

      const accommodationName = readMultiSelectName(props, "Cabaña / Casa");
      const range = props["Check-In / Check-Out"]?.date;
      const nIn = dateOnly(range?.start);
      const nOut = dateOnly(range?.end);

      const notionStatus = props["Estado de la reserva"]?.select?.name || "Pendiente";
      const mappedStatus = statusMap[notionStatus] || "pending";

      if (!accommodationName) {
        skipped_count++;
        debug_skipped_sample.push({ page_id: page.id, reason: "Falta Cabaña / Casa", base44AccommodationNames: base44AccNames });
        continue;
      }

      if (!nIn || !nOut) {
        skipped_count++;
        debug_skipped_sample.push({ page_id: page.id, reason: "Faltan fechas", accommodationName });
        continue;
      }

      // ✅ Crear o buscar Accommodation
      const accRes = await getOrCreateAccommodationByName(base44, accommodationName);
      if (!accRes.ok || !accRes.accommodation?.id) {
        skipped_count++;
        debug_skipped_sample.push({
          page_id: page.id,
          reason: "No pude crear/encontrar Accommodation en Base44",
          accommodationName,
          base44AccommodationNames: base44AccNames,
          createError: accRes.error,
        });
        continue;
      }

      // Crear booking
      const booking = await base44.asServiceRole.entities.Booking.create({
        accommodation_id: accRes.accommodation.id,
        guest_name: guestName,
        guest_email: email,
        guest_phone: phone,
        number_of_guests: guests,
        status: mappedStatus,
        total_price: total,
        special_requests: notes,
        check_in: artIso(nIn, "14:00:00"),
        check_out: artIso(nOut, "18:00:00"),
        source: "notion_manual",
        notion_page_id: page.id,
      });

      // Escribir BookingID44 en Notion (corta el loop)
      const patched = await notionSetBookingId(accessToken, page.id, booking.id);

      created++;
      created_items.push({
        notion_page_id: page.id,
        booking_id: booking.id,
        accommodation_id: accRes.accommodation.id,
        accommodation_name: accRes.accommodation.name,
        accommodation_created_now: accRes.created,
        notion_patch_ok: patched.ok,
        notion_patch_error: patched.details,
      });
    }

    return Response.json({
      success: true,
      mode: "import",
      notion_fetched: (notionData.results || []).length,
      base44_accommodations_before: base44Acc.length,
      base44AccommodationNames_before: base44AccNames.slice(0, 20),
      created,
      deduped,
      skipped_count,
      created_items,
      deduped_items,
      debug_skipped_sample: debug_skipped_sample.slice(0, 10),
      note:
        "Si sigue diciendo que no puede crear Accommodation, entonces el schema tiene campos requeridos o no existe el entity Accommodation en este app.",
    });
  } catch (e: any) {
    return Response.json({ success: false, error: String(e?.message || e) }, { status: 500 });
  }
});