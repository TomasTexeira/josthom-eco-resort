/**
 * extract_from_browser.js
 * ─────────────────────────────────────────────────────────────
 * Pegá este código en la consola del browser mientras tenés
 * abierto el sitio de Base44 (app.base44.com con tu proyecto).
 *
 * Va a descargar automáticamente un archivo base44_export.json
 * con todos los datos que necesitamos.
 */

(async () => {
  console.log("🌿 Extrayendo datos de Base44...");

  // Intentar obtener el cliente de base44 desde el módulo
  // (funciona si estás en la página del proyecto Base44)
  let accommodations = [];
  let galleryImages = [];
  let siteContent = [];

  try {
    // El SDK de Base44 expone las entities en window o en el módulo
    // Intentamos acceder a través de las requests XHR ya cacheadas
    const appId = Object.keys(sessionStorage)
      .find(k => k.includes("base44") || k.includes("app_id"));
    console.log("Session storage keys:", Object.keys(sessionStorage));
    console.log("Local storage keys:", Object.keys(localStorage));
  } catch(e) {}

  // Alternativa: interceptar las llamadas que ya hizo el sitio
  // y extraer de la caché del browser
  const resources = performance.getEntriesByType("resource");
  const base44Reqs = resources.filter(r => r.name.includes("base44") || r.name.includes("entities"));
  console.log("Requests a base44 encontrados:", base44Reqs.map(r => r.name));

  // ─── Método más confiable: fetch directo con las cookies del browser ───
  // Base44 usa cookies de sesión, así que si estás logueado, esto funciona

  async function fetchB44(path) {
    // Probar diferentes variantes de URL
    const urls = [
      `https://app.base44.com${path}`,
      `https://api.base44.com${path}`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, { credentials: "include" });
        if (res.ok) return res.json();
      } catch(e) {}
    }
    throw new Error(`No se pudo acceder a: ${path}`);
  }

  // Obtener app ID del localStorage/sessionStorage de Base44
  let appId = null;
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of Object.keys(storage)) {
      if (key.toLowerCase().includes("app_id") || key === "base44_app_id") {
        appId = storage.getItem(key);
        console.log(`App ID encontrado en ${key}: ${appId}`);
        break;
      }
    }
    if (appId) break;
  }

  if (!appId) {
    // Intentar extraer de la URL actual
    const urlMatch = window.location.href.match(/app[_-]?id[=\/]([a-f0-9]{20,})/i);
    if (urlMatch) appId = urlMatch[1];
  }

  if (!appId) {
    console.warn("⚠️  No se encontró el App ID automáticamente.");
    console.log("Buscá el App ID en: Base44 Dashboard → tu proyecto → Settings");
    console.log("Luego ejecutá en la consola:");
    console.log('  window._b44AppId = "TU-APP-ID"; // y volvé a pegar este script');
    appId = window._b44AppId;
  }

  if (!appId) {
    console.error("❌ No hay App ID. Usá la Opción 1 (con VITE_BASE44_APP_ID).");
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    "X-App-Id": appId,
  };

  // Intentar fetchear las entities
  const endpoints = [
    { url: `/api/apps/prod/entities/Accommodation?app_id=${appId}&sort_by=order&limit=100`, key: "accommodations" },
    { url: `/api/apps/prod/entities/GalleryImage?app_id=${appId}&sort_by=order&limit=200`, key: "galleryImages" },
    { url: `/api/apps/prod/entities/SiteContent?app_id=${appId}&limit=50`, key: "siteContent" },
  ];

  const results = {};

  for (const ep of endpoints) {
    try {
      const res = await fetch(`https://app.base44.com${ep.url}`, { headers, credentials: "include" });
      if (res.ok) {
        results[ep.key] = await res.json();
        console.log(`✓ ${ep.key}: ${Array.isArray(results[ep.key]) ? results[ep.key].length : "?"} registros`);
      } else {
        console.warn(`✗ ${ep.key}: ${res.status}`);
        results[ep.key] = [];
      }
    } catch(e) {
      console.warn(`✗ ${ep.key}: ${e.message}`);
      results[ep.key] = [];
    }
  }

  // Exportar como JSON descargable
  const output = {
    exported_at: new Date().toISOString(),
    app_id: appId,
    accommodations: Array.isArray(results.accommodations) ? results.accommodations : [],
    gallery_images: Array.isArray(results.galleryImages) ? results.galleryImages : [],
    site_content: Array.isArray(results.siteContent) ? results.siteContent : [],
  };

  const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "base44_export.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  console.log("\n✅ Archivo descargado: base44_export.json");
  console.log(`   Alojamientos: ${output.accommodations.length}`);
  console.log(`   Galería:      ${output.gallery_images.length}`);
  console.log(`   Contenido:    ${output.site_content.length}`);
  console.log("\nMovelo a: _migration/scripts/base44_export.json");
  console.log("Luego corré: python _migration/scripts/seed_db.py");
})();
