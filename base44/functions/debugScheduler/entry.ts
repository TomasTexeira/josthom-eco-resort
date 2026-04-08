import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

Deno.serve(async (req) => {
  try {
    console.log("🔍 [DEBUG] === DIAGNÓSTICO SCHEDULER ===");
    
    const base44 = createClientFromRequest(req);
    console.log("🔍 [DEBUG] base44 creado");
    
    // Verificar si hay usuario autenticado
    try {
      const user = await base44.auth.me();
      console.log("🔍 [DEBUG] Usuario autenticado:", user ? user.email : "NINGUNO");
    } catch (e) {
      console.log("🔍 [DEBUG] No hay usuario autenticado (normal en scheduler):", e.message);
    }
    
    // Verificar asServiceRole
    console.log("🔍 [DEBUG] Verificando asServiceRole...");
    const client = base44.asServiceRole;
    
    // Verificar env vars
    const databaseId = Deno.env.get("NOTION_DATABASE_ID");
    console.log("🔍 [DEBUG] NOTION_DATABASE_ID:", databaseId);
    
    // Verificar connector
    console.log("🔍 [DEBUG] Obteniendo token Notion...");
    try {
      const accessToken = await client.connectors.getAccessToken("notion");
      console.log("🔍 [DEBUG] AccessToken:", accessToken ? `✅ ${accessToken.substring(0, 20)}...` : "❌ NULL");
      
      // Probar llamada a Notion
      console.log("🔍 [DEBUG] Probando llamada a Notion API...");
      const notionResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({ page_size: 1 }),
      });
      
      console.log("🔍 [DEBUG] Notion response status:", notionResponse.status);
      const notionData = await notionResponse.json();
      console.log("🔍 [DEBUG] Notion data:", JSON.stringify(notionData, null, 2));
      
    } catch (error) {
      console.error("❌ [ERROR] Error con connector:", error.message);
      console.error("❌ [ERROR] Stack:", error.stack);
    }
    
    // Verificar entities
    console.log("🔍 [DEBUG] Probando acceso a entities...");
    try {
      const accommodations = await client.entities.Accommodation.list();
      console.log("🔍 [DEBUG] Accommodations encontrados:", accommodations.length);
    } catch (error) {
      console.error("❌ [ERROR] Error con entities:", error.message);
    }
    
    return Response.json({ success: true, message: "Ver logs para diagnóstico completo" });
  } catch (error) {
    console.error("❌ [ERROR] Error general:", error.message);
    console.error("❌ [ERROR] Stack:", error.stack);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});