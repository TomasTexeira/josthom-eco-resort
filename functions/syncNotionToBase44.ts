import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

function toDateOnly(iso?: string | null) {
  return iso ? iso.split("T")[0] : null;
}

function withArtTime(dateOnly: string, time: string) {
  return new Date(`${dateOnly}T${time}-03:00`).toISOString();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { accommodation_id, status, check_in, check_out, number_of_guests, total_price } = body;

    if (!accommodation_id) {
      return Response.json({ error: "accommodation_id es requerido" }, { status: 400 });
    }
    if (!check_in || !check_out) {
      return Response.json({ error: "check_in y check_out son requeridos para ubicar la reserva" }, { status: 400 });
    }

    // Notion -> Base44 status
    const statusMap: Record<string, string> = {
      Pendiente: "pending",
      Pago: "confirmed",
      Cancelada: "cancelled",
      Completa: "completed",
    };
    const mappedStatus = statusMap[status] ?? status;

    // Normalizar fechas a date-only
    const inDate = toDateOnly(check_in);
    const outDate = toDateOnly(check_out);
    if (!inDate || !outDate) {
      return Response.json({ error: "check_in/check_out inválidos" }, { status: 400 });
    }

    // Buscar booking en Base44 por accommodation_id + fechas (date-only)
    // Nota: si tu SDK no soporta filter así, lo hacemos list + filter en memoria.
    const list = await base44.asServiceRole.entities.Booking.list({
      limit: 50,
      filter: { accommodation_id }, // si no existe filter, borrar esta línea y filtrar abajo
      sort: { created_date: -1 },
    });

    const bookings = list?.items ?? [];

    const match = bookings.find((b: any) => {
      const bIn = toDateOnly(b.check_in);
      const bOut = toDateOnly(b.check_out);
      return bIn === inDate && bOut === outDate;
    });

    if (!match) {
      return Response.json(
        { error: "No encontré booking que matchee accommodation_id + fechas", accommodation_id, inDate, outDate },
        { status: 404 }
      );
    }

    const updateFields: Record<string, any> = {};

    if (status != null && status !== "") updateFields.status = mappedStatus;

    // Si querés fijar SIEMPRE 14/18 cuando cambiás desde Notion:
    updateFields.check_in = withArtTime(inDate, "14:00:00");
    updateFields.check_out = withArtTime(outDate, "18:00:00");

    // números: permitir 0
    if (number_of_guests != null) updateFields.number_of_guests = number_of_guests;
    if (total_price != null) updateFields.total_price = total_price;

    const updated = await base44.asServiceRole.entities.Booking.update(match.id, updateFields);

    return Response.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Error syncing from Notion:", error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});