import { createClient, createClientFromRequest } from "npm:@base44/sdk@0.8.6";

function getBase44(req: Request) {
  try {
    return createClientFromRequest(req);
  } catch {
    const token = Deno.env.get("BASE44_SERVICE_ROLE_TOKEN");
    if (!token) throw new Error("Missing BASE44_SERVICE_ROLE_TOKEN");
    return createClient({ token });
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = getBase44(req);

    // OJO: si tu entidad se llama distinto, cambia "Accommodation" por el nombre exacto
    const list = await base44.asServiceRole.entities.Accommodation.list({
      limit: 50,
      sort: { created_date: -1 },
    });

    const items = (list?.items || list || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      capacity: a.capacity,
    }));

    return Response.json({
      ok: true,
      count: items.length,
      items,
    });
  } catch (e) {
    return Response.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    );
  }
});