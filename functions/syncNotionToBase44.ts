import { createClient, createClientFromRequest } from "npm:@base44/sdk@0.8.6";

const NOTION_VERSION = "2022-06-28";

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

function msFirstName(props: any, key: string) {
  const ms = props?.[key]?.multi_select;
  if (!ms || !ms.length) return "";
  return (ms[0]?.name || "").trim();
}

Deno.serve(async (req) => {
  try {
    const base44 = getBase44(req);

    // --- ENV CHECKS ---
    const env = {
      hasServiceRoleToken: Boolean(Deno.env.get("BASE44_SERVICE_ROLE_TOKEN")),
      hasNotionDb: Boolean(Deno.env.get("NOTION_DATABASE_ID")),
    };

    // --- BASE44: ACCOMMODATIONS ---
    let accommodations: any[] = [];
    let accommodationsError: string | null = null;

    try {
      const res = await base44.asServiceRole.entities.Accommodation.list({ limit: 200 });
      accommodations = res?.items || res || [];
    } catch (e) {
      accommodationsError = String(e?.message || e);
    }

    const accommodationNames = accommodations
      .map((a) => a?.name)
      .filter(Boolean)
      .map((n) => String(n).trim());

    const accByName = new Map(
      accommodations.map((a) => [String(a.name || "").trim().toLowerCase(), a])
    );

    // --- BASE44: BOOKINGS (sanity) ---
    let bookings: any[] = [];
    let bookingsError: string | null = null;

    try {
      const res = await base44.asServiceRole.entities.Booking.list({ limit: 5, sort: { created_date: -1 } as any });
      bookings = res?.items || res || [];
    } catch (e) {
      bookingsError = String(e?.message || e);
    }

    // --- NOTION ---
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");
    const databaseId = Deno.env.get("NOTION_DATABASE_ID");
    if (!databaseId) {
      return Response.json({ error: "NOTION_DATABASE_ID no configurado" }, { status: 500 });
    }

    // Trae solo páginas donde BookingID44 está vacío (reservas nuevas creadas a mano)
    const notionRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VERSION,
      },
      body: JSON.stringify({
        page_size: 5,
        sorts: [{ timestamp: "created_time", direction: "descending" }],
        filter: {
          property: "BookingID44",
          rich_text: { is_empty: true },
        },
      }),
    });

    if (!notionRes.ok) {
      return Response.json(
        { error: "Notion query failed", details: await notionRes.text() },
        { status: notionRes.status }
      );
    }

    const notionData = await notionRes.json();

    const notionSample = (notionData.results || []).map((page: any) => {
      const props = page.properties || {};

      const accommodationName = msFirstName(props, "Cabaña / Casa"); // multi_select
      const normalized = accommodationName.trim().toLowerCase();
      const matched = normalized ? Boolean(accByName.get(normalized)) : false;

      return {
        page_id: page.id,
        created_time: page.created_time,
        guest_name: titlePlain(props, "Nombre del huésped"),
        accommodationName,
        matched,
        reason: matched
          ? "OK"
          : !accommodationName
          ? "Notion: Cabaña / Casa vacío"
          : accommodations.length === 0
          ? "Base44: Accommodation.list devolvió 0"
          : "No matchea contra Accommodation.name (comparación exacta, case-insensitive)",
      };
    });

    return Response.json({
      ok: true,
      env,
      base44: {
        accommodations: {
          count: accommodations.length,
          error: accommodationsError,
          sample: accommodations.slice(0, 10).map((a) => ({ id: a.id, name: a.name })),
          names: accommodationNames.slice(0, 50),
        },
        bookings: {
          count: bookings.length,
          error: bookingsError,
          sample: bookings.slice(0, 3).map((b) => ({
            id: b.id,
            accommodation_id: b.accommodation_id,
            status: b.status,
            check_in: b.check_in,
            check_out: b.check_out,
          })),
        },
      },
      notion: {
        fetched: (notionData.results || []).length,
        sample: notionSample,
      },
    });
  } catch (error) {
    return Response.json({ error: String(error?.message || error) }, { status: 500 });
  }
});