import { createClient, createClientFromRequest } from "npm:@base44/sdk@0.8.6";

function getBase44(req: Request) {
  try {
    return createClientFromRequest(req);
  } catch {
    const token = Deno.env.get("BASE44_SERVICE_ROLE_TOKEN");
    if (!token) throw new Error("Missing env var: BASE44_SERVICE_ROLE_TOKEN");
    return createClient({ token });
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = getBase44(req);

    // Accommodation.list con SDK
    let accommodations: any[] = [];
    let accError: string | null = null;
    try {
      const res: any = await base44.asServiceRole.entities.Accommodation.list({ limit: 50 });
      accommodations = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
    } catch (e: any) {
      accError = String(e?.message || e);
    }

    // Booking.list con SDK
    let bookings: any[] = [];
    let bookingError: string | null = null;
    try {
      const res: any = await base44.asServiceRole.entities.Booking.list({ limit: 10, sort: { created_date: -1 } });
      bookings = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
    } catch (e: any) {
      bookingError = String(e?.message || e);
    }

    const names = accommodations.map((a) => a?.name).filter(Boolean);

    return Response.json({
      ok: true,
      accommodations: {
        count: accommodations.length,
        names,
        sample: accommodations.slice(0, 5).map((a) => ({ id: a?.id, name: a?.name })),
        error: accError,
      },
      bookings: {
        count: bookings.length,
        sample: bookings.slice(0, 3).map((b) => ({ id: b?.id, accommodation_id: b?.accommodation_id, status: b?.status })),
        error: bookingError,
      },
      note: "Ejecutá esto manual y por automation. Si manual >0 y automation 0 => token/entorno distinto.",
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
});