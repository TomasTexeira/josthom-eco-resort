import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

const APP_ID = "696a5cf868f1a8d949987da4";
const NOTION_VERSION = "2022-06-28";

// -------------------------
// Helpers
// -------------------------
function mustEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function isoWithFixedTime(dateOrIso: string, time: "14:00:00" | "18:00:00") {
  // Notion puede venir "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss..." → tomamos solo fecha
  const day = (dateOrIso || "").slice(0, 10);
  if (!day || day.length !== 10) return null;
  // Argentina UTC-3 fijo según tu regla
  const dt = new Date(`${day}T${time}-03:00`);
  return dt.toISOString();
}

function getNotionRichText(props: any, key: string) {
  const rt = props?.[key]?.rich_text;
  if (!Array.isArray(rt) || rt.length === 0) return "";
  return rt.map((x: any) => x?.plain_text ?? x?.text?.content ?? "").join("").trim();
}

function getNotionTitle(props: any, key: string) {
  const t = props?.[key]?.title;
  if (!Array.isArray(t) || t.length === 0) return "";
  return t.map((x: any) => x?.plain_text ?? x?.text?.content ?? "").join("").trim();
}

function getNotionEmail(props: any, key: string) {
  return props?.[key]?.email ?? "";
}

function getNotionNumber(props: any, key: string) {
  const n = props?.[key]?.number;
  return typeof n === "number" ? n : 0;
}

function getNotionSelect(props: any, key: string) {
  return props?.[key]?.select?.name ?? null;
}

function getNotionMultiSelectFirst(props: any, key: string) {
  const ms = props?.[key]?.multi_select;
  if (!Array.isArray(ms) || ms.length === 0) return null;
  return ms[0]?.name ?? null;
}

function mapNotionStatusToBase44(notionStatus: string | null) {
  const map: Record<string, string> = {
    "Pendiente": "pending",
    "Pago": "confirmed",
    "Cancelada": "cancelled",
    "Completa": "completed",
  };
  return map[notionStatus ?? ""] ?? "pending";
}

async function notionQueryAll(accessToken: string, databaseId: string, body: any) {
  const results: any[] = [];
  let cursor: string | undefined = undefined;

  while (true) {
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VERSION,
      },
      body: JSON.stringify({
        ...body,
        start_cursor: cursor,
        page_size: 100,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Notion query failed: ${res.status} ${t}`);
    }

    const data = await res.json();
    results.push(...(data.results ?? []));
    if (!data.has_more) break;
    cursor = data.next_cursor;
    if (!cursor) break;
  }

  return results;
}

async function notionUpdatePage(accessToken: string, pageId: string, properties: any) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({ properties }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Notion page update failed: ${res.status} ${t}`);
  }

  return await res.json();
}

async function base44EntitiesList(apiKey: string, entity: string, limit = 200) {
  // Nota: endpoint que vos pegaste
  const url = `https://app.base44.com/api/apps/${APP_ID}/entities/${entity}?limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      "api_key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Base44 entities list failed (${entity}): ${res.status} ${t}`);
  }

  return await res.json();
}

async function base44EntitiesCreate(apiKey: string, entity: string, payload: any) {
  const url = `https://app.base44.com/api/apps/${APP_ID}/entities/${entity}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "api_key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Base44 entities create failed (${entity}): ${res.status} ${t}`);
  }

  return await res.json();
}

// -------------------------
// Main
// -------------------------
Deno.serve(async (req) => {
  try {
    // Mantengo el client por si lo necesitás después, pero el core acá usa Entities API
    createClientFromRequest(req);

    const notionDb = mustEnv("NOTION_DATABASE_ID");
    const base44ApiKey = mustEnv("1a017929fe224edd9a0651d7c08b37ac");

    // Token Notion desde connector (tu set actual)
    const base44 = createClientFromRequest(req);
    const notionToken = await base44.asServiceRole.connectors.getAccessToken("notion");

    // 1) Traer accommodations desde Base44 (ENTITIES)
    const accListRaw = await base44EntitiesList(base44ApiKey, "Accommodation", 500);

    // Algunas APIs devuelven {items:[...]} y otras directo [...]
    const accItems: any[] = Array.isArray(accListRaw) ? accListRaw : (accListRaw.items ?? accListRaw.data ?? []);
    const accByName = new Map<string, any>();
    for (const a of accItems) {
      if (a?.name) accByName.set(String(a.name).trim().toLowerCase(), a);
    }

    // 2) Traer desde Notion las reservas NUEVAS cargadas a mano:
    //    - BookingID44 VACÍO (tu columna)
    //    - y con fecha + alojamiento seleccionado
    const notionPages = await notionQueryAll(notionToken, notionDb, {
      filter: {
        and: [
          {
            property: "BookingID44",
            rich_text: { is_empty: true },
          },
          // opcional: ignorar canceladas
          {
            property: "Estado de la reserva",
            select: { does_not_equal: "Cancelada" },
          },
        ],
      },
      sorts: [
        { timestamp: "created_time", direction: "ascending" },
      ],
    });

    const created: any[] = [];
    const skipped: any[] = [];

    for (const page of notionPages) {
      const props = page.properties;

      const accommodationName = getNotionMultiSelectFirst(props, "Cabaña / Casa");
      const dateRange = props?.["Check-In / Check-Out"]?.date;
      const start = dateRange?.start;
      const end = dateRange?.end;

      if (!accommodationName || !start || !end) {
        skipped.push({
          page_id: page.id,
          reason: "Faltan datos: Cabaña / Casa o Check-In / Check-Out incompleto",
          accommodationName,
          start,
          end,
        });
        continue;
      }

      const acc = accByName.get(String(accommodationName).trim().toLowerCase());
      if (!acc) {
        skipped.push({
          page_id: page.id,
          reason: "No matchea nombre de alojamiento con Base44 (ENTITIES)",
          accommodationName,
          base44AccommodationNames: Array.from(accByName.keys()),
        });
        continue;
      }

      // Campos guest
      const guest_name =
        getNotionTitle(props, "Nombre del huésped") ||
        getNotionRichText(props, "Nombre del huésped") ||
        "Sin nombre";

      const guest_phone = getNotionRichText(props, "Teléfono / WhatsApp");
      const guest_email = getNotionEmail(props, "Email");
      const number_of_guests = getNotionNumber(props, "Cant. huéspedes");
      const total_price = getNotionNumber(props, "Monto total");
      const special_requests = getNotionRichText(props, "Notas");

      const notionStatus = getNotionSelect(props, "Estado de la reserva");
      const status = mapNotionStatusToBase44(notionStatus);

      // Forzamos horarios como pediste
      const check_in = isoWithFixedTime(start, "14:00:00");
      const check_out = isoWithFixedTime(end, "18:00:00");

      if (!check_in || !check_out) {
        skipped.push({
          page_id: page.id,
          reason: "Fechas inválidas",
          start,
          end,
        });
        continue;
      }

      // 3) Crear Booking en Base44 (ENTITIES)
      const bookingPayload = {
        accommodation_id: acc.id,
        accommodation_name: acc.name, // si tu Booking tiene este campo, bien; si no, no molesta (Base44 lo ignorará o fallará)
        check_in,
        check_out,
        guest_name,
        guest_email,
        guest_phone,
        number_of_guests,
        status,
        total_price,
        special_requests,
        source: "notion_manual", // opcional
      };

      let newBooking: any;
      try {
        newBooking = await base44EntitiesCreate(base44ApiKey, "Booking", bookingPayload);
      } catch (e) {
        skipped.push({
          page_id: page.id,
          reason: "Error creando Booking en Base44",
          accommodationName,
          error: String(e?.message || e),
        });
        continue;
      }

      const bookingId = newBooking?.id;
      if (!bookingId) {
        skipped.push({
          page_id: page.id,
          reason: "Booking creado pero Base44 no devolvió id",
          newBooking,
        });
        continue;
      }

      // 4) Escribir BookingID44 en Notion + opcional AccommodationID44
      try {
        await notionUpdatePage(notionToken, page.id, {
          "BookingID44": {
            rich_text: [{ text: { content: String(bookingId) } }],
          },
          "AccommodationID44": {
            rich_text: [{ text: { content: String(acc.id) } }],
          },
        });
      } catch (e) {
        // Booking ya creado; devolvemos info para que lo puedas arreglar
        skipped.push({
          page_id: page.id,
          reason: "Booking creado pero falló update en Notion",
          bookingId,
          error: String(e?.message || e),
        });
        continue;
      }

      created.push({
        page_id: page.id,
        accommodationName,
        accommodation_id: acc.id,
        booking_id: bookingId,
        status,
      });
    }

    return Response.json({
      success: true,
      mode: "import",
      base44: {
        accommodations_count: accItems.length,
        accommodations_sample: accItems.slice(0, 3).map((a) => ({ id: a.id, name: a.name })),
      },
      notion: {
        fetched: notionPages.length,
      },
      created_count: created.length,
      created,
      skipped_count: skipped.length,
      skipped_sample: skipped.slice(0, 5),
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error?.message || error) },
      { status: 500 },
    );
  }
});