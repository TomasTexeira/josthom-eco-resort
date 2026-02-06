import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // -----------------------------
    // ENV / CONFIG
    // -----------------------------
    const databaseId = Deno.env.get("NOTION_DATABASE_ID");
    if (!databaseId) {
      return Response.json(
        { success: false, error: "NOTION_DATABASE_ID no configurado" },
        { status: 500 },
      );
    }

    // Needed to read Accommodation entities via Entities API (because SDK list can return 0)
    const base44ApiKey = Deno.env.get("BASE44_API_KEY");
    if (!base44ApiKey) {
      return Response.json(
        { success: false, error: "Missing env var: BASE44_API_KEY" },
        { status: 500 },
      );
    }

    // App ID: from header (when run inside Base44) or env for automations
    const appId =
      req.headers.get("X-Active-App-Id") ||
      Deno.env.get("BASE44_APP_ID") ||
      "696a5cf868f1a8d949987da4"; // fallback (your app id)

    // Notion token from Base44 connector
    const notionToken = await base44.asServiceRole.connectors.getAccessToken(
      "notion",
    );

    const NOTION_VERSION = "2022-06-28";

    // Notion fields (as in your DB)
    const NOTION_FIELD_BOOKING_ID = "BookingID44"; // <-- your field for the Base44 Booking.id
    const NOTION_FIELD_ACCOMMODATION = "Cabaña / Casa"; // multi_select
    const NOTION_FIELD_DATE_RANGE = "Check-In / Check-Out"; // date range
    const NOTION_FIELD_GUEST_NAME = "Nombre del huésped"; // title
    const NOTION_FIELD_GUEST_PHONE = "Teléfono / WhatsApp"; // rich_text
    const NOTION_FIELD_GUEST_EMAIL = "Email"; // email
    const NOTION_FIELD_GUESTS = "Cant. huéspedes"; // number
    const NOTION_FIELD_TOTAL = "Monto total"; // number
    const NOTION_FIELD_NOTES = "Notas"; // rich_text
    const NOTION_FIELD_STATUS = "Estado de la reserva"; // select: Pendiente/Pago/Cancelada/Completa

    // Status mapping Notion -> Base44
    const statusMap: Record<string, string> = {
      Pendiente: "pending",
      Pago: "confirmed",
      Cancelada: "cancelled",
      Completa: "completed",
    };

    // Helpers
    const dateOnly = (iso: string) => iso.split("T")[0];

    const toArtISO = (dateISO: string, hhmm: "14:00" | "18:00") => {
      // If dateISO already has time, normalize to date
      const d = dateOnly(dateISO);
      const time = hhmm === "14:00" ? "T14:00:00-03:00" : "T18:00:00-03:00";
      return new Date(d + time).toISOString();
    };

    // -----------------------------
    // 1) Read Accommodation entities (names + ids) from Base44 Entities API
    // -----------------------------
    const accRes = await fetch(
      `https://app.base44.com/api/apps/${appId}/entities/Accommodation`,
      {
        headers: {
          api_key: base44ApiKey,
          "Content-Type": "application/json",
        },
      },
    );

    if (!accRes.ok) {
      const details = await accRes.text();
      return Response.json(
        {
          success: false,
          error: "No pude leer Accommodation entities",
          details,
          appId,
        },
        { status: 500 },
      );
    }

    const accData = await accRes.json();
    const accommodations: any[] = (accData?.items ??
      accData?.data ??
      accData) || [];

    // Build map by exact name (e.g. "Cabaña 1")
    const accommodationByName = new Map<string, any>();
    for (const a of accommodations) {
      if (a?.name) accommodationByName.set(String(a.name).trim(), a);
    }

    // -----------------------------
    // 2) Query Notion pages that DO NOT have BookingID44 (manual entries)
    // -----------------------------
    const notionQueryRes = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Content-Type": "application/json",
          "Notion-Version": NOTION_VERSION,
        },
        body: JSON.stringify({
          page_size: 50,
          filter: {
            property: NOTION_FIELD_BOOKING_ID,
            rich_text: { is_empty: true },
          },
          sorts: [{ timestamp: "created_time", direction: "ascending" }],
        }),
      },
    );

    if (!notionQueryRes.ok) {
      const details = await notionQueryRes.text();
      return Response.json(
        { success: false, error: "Error consultando Notion", details },
        { status: notionQueryRes.status },
      );
    }

    const notionData = await notionQueryRes.json();
    const pages: any[] = notionData?.results ?? [];

    const created: any[] = [];
    const skipped: any[] = [];

    // -----------------------------
    // 3) For each Notion page -> create Booking in Base44 -> write BookingID44 back to Notion
    // -----------------------------
    for (const page of pages) {
      const props = page?.properties ?? {};
      const pageId = page?.id;

      // Read values from Notion
      const guestName =
        props[NOTION_FIELD_GUEST_NAME]?.title?.[0]?.plain_text?.trim() ?? "";
      const guestPhone =
        props[NOTION_FIELD_GUEST_PHONE]?.rich_text?.[0]?.plain_text?.trim() ??
          "";
      const guestEmail = props[NOTION_FIELD_GUEST_EMAIL]?.email ?? "";

      const accommodationName =
        props[NOTION_FIELD_ACCOMMODATION]?.multi_select?.[0]?.name?.trim() ??
          "";

      const statusNotion = props[NOTION_FIELD_STATUS]?.select?.name ?? "Pendiente";
      const status = statusMap[statusNotion] ?? "pending";

      const guests = props[NOTION_FIELD_GUESTS]?.number ?? 0;
      const totalPrice = props[NOTION_FIELD_TOTAL]?.number ?? 0;
      const notes =
        props[NOTION_FIELD_NOTES]?.rich_text?.[0]?.plain_text?.trim() ?? "";

      const range = props[NOTION_FIELD_DATE_RANGE]?.date;
      const start = range?.start;
      const end = range?.end;

      if (!pageId) {
        skipped.push({ reason: "Notion page sin id", guestName });
        continue;
      }

      if (!accommodationName) {
        skipped.push({ page_id: pageId, reason: "Falta Cabaña / Casa" });
        continue;
      }

      // Match accommodation by name
      const acc = accommodationByName.get(accommodationName);
      if (!acc?.id) {
        skipped.push({
          page_id: pageId,
          reason: "No matchea nombre de alojamiento con Base44",
          accommodationName,
          base44AccommodationNames: [...accommodationByName.keys()],
        });
        continue;
      }

      if (!start || !end) {
        skipped.push({ page_id: pageId, reason: "Falta rango Check-In / Check-Out" });
        continue;
      }

      // Apply fixed times (ART)
      const checkInISO = toArtISO(start, "14:00");
      const checkOutISO = toArtISO(end, "18:00");

      // (Optional but recommended) avoid creating overlaps if there is already a booking active.
      // We'll do a simple search in Base44 bookings by accommodation_id and then overlap check.
      let overlap = false;
      try {
        const existing = await fetch(
          `https://app.base44.com/api/apps/${appId}/entities/Booking?accommodation_id=${encodeURIComponent(acc.id)}`,
          {
            headers: {
              api_key: base44ApiKey,
              "Content-Type": "application/json",
            },
          },
        );

        if (existing.ok) {
          const existingData = await existing.json();
          const bookings: any[] = existingData?.items ?? existingData?.data ?? [];
          const newStart = new Date(checkInISO).getTime();
          const newEnd = new Date(checkOutISO).getTime();

          for (const b of bookings) {
            const bStatus = String(b?.status ?? "");
            if (bStatus === "cancelled") continue;

            const bStart = new Date(b?.check_in).getTime();
            const bEnd = new Date(b?.check_out).getTime();

            // overlap: (start < bEnd) && (end > bStart)
            if (newStart < bEnd && newEnd > bStart) {
              overlap = true;
              break;
            }
          }
        }
      } catch {
        // if overlap check fails, we still proceed (or you can skip hard)
      }

      if (overlap) {
        skipped.push({
          page_id: pageId,
          reason: "Superposición detectada (no se creó en Base44)",
          accommodationName,
          check_in: checkInISO,
          check_out: checkOutISO,
        });
        continue;
      }

      // Create booking in Base44
      const booking = await base44.asServiceRole.entities.Booking.create({
        accommodation_id: acc.id,
        accommodation_name: accommodationName,
        guest_name: guestName,
        guest_phone: guestPhone,
        guest_email: guestEmail,
        number_of_guests: guests,
        status,
        total_price: totalPrice,
        special_requests: notes,
        check_in: checkInISO,
        check_out: checkOutISO,
      });

      // Write BookingID44 back to Notion (prevents infinite loop)
      const notionUpdateRes = await fetch(
        `https://api.notion.com/v1/pages/${pageId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${notionToken}`,
            "Content-Type": "application/json",
            "Notion-Version": NOTION_VERSION,
          },
          body: JSON.stringify({
            properties: {
              [NOTION_FIELD_BOOKING_ID]: {
                rich_text: [{ text: { content: String(booking.id) } }],
              },
            },
          }),
        },
      );

      if (!notionUpdateRes.ok) {
        const details = await notionUpdateRes.text();
        // If Notion update fails, you will loop. So we log it explicitly.
        skipped.push({
          page_id: pageId,
          reason: "Booking creado en Base44 pero NO se pudo escribir BookingID44 en Notion (loop risk)",
          base44_booking_id: booking.id,
          details,
        });
        continue;
      }

      created.push({
        notion_page_id: pageId,
        base44_booking_id: booking.id,
        accommodation_id: acc.id,
        accommodation_name: accommodationName,
        status,
        check_in: checkInISO,
        check_out: checkOutISO,
      });
    }

    return Response.json({
      success: true,
      mode: "import",
      fetchedFromNotion: pages.length,
      created: created.length,
      items: created,
      skipped_count: skipped.length,
      debug_skipped_sample: skipped.slice(0, 10),
      base44AccommodationCount: accommodations.length,
      base44AccommodationNames: [...accommodationByName.keys()],
    });
  } catch (error) {
    console.error("syncNotionToBase44 error:", error);
    return Response.json(
      { success: false, error: error?.message ?? String(error) },
      { status: 500 },
    );
  }
});