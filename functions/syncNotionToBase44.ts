import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

const NOTION_VERSION = "2022-06-28";

// Helpers Notion
function getTitle(props: any, name: string): string {
  const t = props?.[name]?.title;
  return Array.isArray(t) && t[0]?.plain_text ? t.map((x: any) => x.plain_text).join("") : "";
}

function getRichText(props: any, name: string): string {
  const rt = props?.[name]?.rich_text;
  return Array.isArray(rt) && rt[0]?.plain_text ? rt.map((x: any) => x.plain_text).join("") : "";
}

function getEmail(props: any, name: string): string {
  return props?.[name]?.email ?? "";
}

function getNumber(props: any, name: string): number {
  return typeof props?.[name]?.number === "number" ? props[name].number : 0;
}

function getSelectName(props: any, name: string): string {
  return props?.[name]?.select?.name ?? "";
}

function getMultiSelectFirstName(props: any, name: string): string {
  const ms = props?.[name]?.multi_select;
  return Array.isArray(ms) && ms[0]?.name ? ms[0].name : "";
}

function getDateRange(props: any, name: string): { start?: string; end?: string } {
  const d = props?.[name]?.date;
  return d ? { start: d.start, end: d.end } : {};
}

// Normaliza a YYYY-MM-DD
function toDateOnly(iso?: string): string {
  if (!iso) return "";
  return iso.split("T")[0];
}

// Fuerza horarios ART
function buildARTDateTime(dateOnly: string, time: "14:00:00" | "18:00:00"): string {
  // dateOnly: YYYY-MM-DD
  // Construimos con -03:00 y lo pasamos a ISO (UTC) para Base44
  const dt = new Date(`${dateOnly}T${time}-03:00`);
  return dt.toISOString();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");
    const databaseId = Deno.env.get("NOTION_DATABASE_ID");
    const base44ApiKey = Deno.env.get("BASE44_API_KEY"); // para listar accommodations si hace falta

    if (!databaseId) return Response.json({ success: false, error: "NOTION_DATABASE_ID no configurado" }, { status: 500 });
    if (!base44ApiKey) return Response.json({ success: false, error: "Missing env var: BASE44_API_KEY" }, { status: 500 });

    // 1) Traer solo los que NO tienen BookingID44
    const notionResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VERSION,
      },
      body: JSON.stringify({
        page_size: 50,
        filter: {
          property: "BookingID44",
          rich_text: { is_empty: true },
        },
        sorts: [{ timestamp: "created_time", direction: "ascending" }],
      }),
    });

    if (!notionResponse.ok) {
      const details = await notionResponse.text();
      return Response.json({ success: false, error: "Error consultando Notion", details }, { status: 500 });
    }

    const notionData = await notionResponse.json();
    const pages = notionData.results ?? [];

    // 2) Listar accommodations desde Entities API (porque el SDK te estaba devolviendo 0)
    const accRes = await fetch(
      `https://app.base44.com/api/apps/${base44.appId}/entities/Accommodation`,
      {
        headers: {
          api_key: base44ApiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!accRes.ok) {
      const details = await accRes.text();
      return Response.json({ success: false, error: "No pude leer Accommodation entities", details }, { status: 500 });
    }

    const accData = await accRes.json();
    const accommodations: any[] = accData?.items ?? accData?.data ?? accData ?? [];
    const accommodationByName = new Map<string, any>();
    for (const a of accommodations) {
      if (a?.name) accommodationByName.set(a.name.trim(), a);
    }

    const statusMap: Record<string, string> = {
      Pendiente: "pending",
      Pago: "confirmed",
      Cancelada: "cancelled",
      Completa: "completed",
    };

    const created: any[] = [];
    const skipped: any[] = [];

    for (const page of pages) {
      const props = page.properties;

      const pageId = page.id;

      // Notion fields
      const guestName = getTitle(props, "Nombre del huésped") || getRichText(props, "Nombre del huésped");
      const phone = getRichText(props, "Teléfono / WhatsApp");
      const email = getEmail(props, "Email");
      const accommodationName = getMultiSelectFirstName(props, "Cabaña / Casa");
      const { start, end } = getDateRange(props, "Check-In / Check-Out");
      const guests = getNumber(props, "Cant. huéspedes");
      const total = getNumber(props, "Monto total");
      const notes = getRichText(props, "Notas");
      const notionStatus = getSelectName(props, "Estado de la reserva");
      const mappedStatus = statusMap[notionStatus] || "pending";

      if (!accommodationName) {
        skipped.push({ page_id: pageId, reason: "Falta Cabaña / Casa" });
        continue;
      }
      if (!start || !end) {
        skipped.push({ page_id: pageId, reason: "Falta rango Check-In / Check-Out" });
        continue;
      }

      const acc = accommodationByName.get(accommodationName.trim());
      if (!acc) {
        skipped.push({
          page_id: pageId,
          reason: "No matchea nombre de alojamiento con Base44",
          accommodationName,
          base44AccommodationNames: Array.from(accommodationByName.keys()),
        });
        continue;
      }

      // Convertimos a fechas-only y seteamos horarios ART
      const checkInDateOnly = toDateOnly(start);
      const checkOutDateOnly = toDateOnly(end);

      const check_in = buildARTDateTime(checkInDateOnly, "14:00:00");
      const check_out = buildARTDateTime(checkOutDateOnly, "18:00:00");

      // 3) Crear booking en Base44 DB (entities Booking)
      const booking = await base44.asServiceRole.entities.Booking.create({
        accommodation_id: acc.id,
        accommodation_name: acc.name,
        guest_name: guestName || "Sin nombre",
        guest_phone: phone || "",
        guest_email: email || "",
        number_of_guests: guests || 0,
        total_price: total || 0,
        special_requests: notes || "",
        status: mappedStatus,
        check_in,
        check_out,
      });

      // 4) PATCH a Notion para escribir BookingID44 (y opcional AccommodationID44)
      const patchRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Notion-Version": NOTION_VERSION,
        },
        body: JSON.stringify({
          properties: {
            // 👇 Esto evita el loop
            BookingID44: {
              rich_text: [{ text: { content: booking.id } }],
            },

            // Si querés también guardar el accommodation_id:
            AccommodationID44: {
              rich_text: [{ text: { content: acc.id } }],
            },
          },
        }),
      });

      if (!patchRes.ok) {
        const details = await patchRes.text();
        // MUY IMPORTANTE: si falla patch, lo vas a re-importar en loop.
        // Devolvemos error para que lo veas y lo arregles.
        return Response.json(
          {
            success: false,
            error: "Creé booking en Base44 pero NO pude escribir BookingID44 en Notion (evita loop).",
            page_id: pageId,
            booking_id: booking.id,
            details,
            hint: "Verificá que BookingID44 y AccommodationID44 sean Rich text en Notion (no fórmula/rollup).",
          },
          { status: 500 }
        );
      }

      created.push({
        page_id: pageId,
        booking_id: booking.id,
        accommodation_id: acc.id,
        accommodation_name: acc.name,
      });
    }

    return Response.json({
      success: true,
      mode: "import",
      fetched: pages.length,
      created: created.length,
      items: created,
      skipped_count: skipped.length,
      skipped_sample: skipped.slice(0, 10),
    });
  } catch (error) {
    return Response.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
});