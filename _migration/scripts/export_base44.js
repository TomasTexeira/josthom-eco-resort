/**
 * export_base44.js
 * ─────────────────────────────────────────────────────────
 * Exporta todos los datos de Accommodations y GalleryImages
 * desde la API de Base44 y los guarda como JSON.
 *
 * USO (desde la carpeta raíz del proyecto original):
 *   node _migration/scripts/export_base44.js
 *
 * REQUISITOS:
 *   - Tener VITE_BASE44_APP_ID en el entorno (o pegarlo abajo)
 *   - Node 18+ (usa fetch nativo)
 *
 * OUTPUT:
 *   _migration/scripts/base44_export.json
 */

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ─── Config ──────────────────────────────────────────────
// Si no tenés la variable de entorno, pegá el app ID acá:
const APP_ID = process.env.VITE_BASE44_APP_ID || "696a5cf868f1a8d949987da4";
const BASE44_API = "https://app.base44.com";

// ─── Helper ──────────────────────────────────────────────
async function fetchEntities(entityName, params = {}) {
  const qs = new URLSearchParams({
    app_id: APP_ID,
    ...params,
  }).toString();

  const url = `${BASE44_API}/api/apps/prod/entities/${entityName}?${qs}`;
  console.log(`Fetching ${entityName}...`);

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-App-Id": APP_ID,
    },
  });

  if (!res.ok) {
    // Intentar método alternativo (POST query)
    const res2 = await fetch(`${BASE44_API}/api/apps/prod/entities/${entityName}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-Id": APP_ID,
      },
      body: JSON.stringify({ sort_by: "order", limit: 200 }),
    });

    if (!res2.ok) {
      throw new Error(`Error fetching ${entityName}: ${res.status} ${await res.text()}`);
    }
    return res2.json();
  }

  return res.json();
}

// ─── Main ────────────────────────────────────────────────
async function main() {
  console.log(`\n🌿 Exportando datos de Base44 (app: ${APP_ID})\n`);

  let accommodations = [];
  let galleryImages = [];
  let siteContent = [];

  try {
    accommodations = await fetchEntities("Accommodation", { sort_by: "order", limit: "100" });
    console.log(`  ✓ ${Array.isArray(accommodations) ? accommodations.length : "?"} alojamientos`);
  } catch (e) {
    console.warn(`  ✗ No se pudieron obtener alojamientos: ${e.message}`);
  }

  try {
    galleryImages = await fetchEntities("GalleryImage", { sort_by: "order", limit: "200" });
    console.log(`  ✓ ${Array.isArray(galleryImages) ? galleryImages.length : "?"} imágenes de galería`);
  } catch (e) {
    console.warn(`  ✗ No se pudieron obtener galería: ${e.message}`);
  }

  try {
    siteContent = await fetchEntities("SiteContent", { limit: "50" });
    console.log(`  ✓ ${Array.isArray(siteContent) ? siteContent.length : "?"} contenidos de sitio`);
  } catch (e) {
    console.warn(`  ✗ No se pudo obtener contenido de sitio: ${e.message}`);
  }

  const output = {
    exported_at: new Date().toISOString(),
    app_id: APP_ID,
    accommodations: Array.isArray(accommodations) ? accommodations : [],
    gallery_images: Array.isArray(galleryImages) ? galleryImages : [],
    site_content: Array.isArray(siteContent) ? siteContent : [],
  };

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const outPath = join(__dirname, "base44_export.json");

  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");

  console.log(`\n✅ Exportación guardada en: ${outPath}`);
  console.log(`   Alojamientos: ${output.accommodations.length}`);
  console.log(`   Galería:      ${output.gallery_images.length}`);
  console.log(`   Contenido:    ${output.site_content.length}`);
  console.log(`\nAhora corré: python _migration/scripts/seed_db.py\n`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  console.log("\nSi el script falla, probá:");
  console.log("  1. Abrir el sitio de Base44 en el browser");
  console.log("  2. Abrir DevTools → Network → buscar requests a 'entities'");
  console.log("  3. Copiar la respuesta JSON y pegarla en base44_export.json manualmente\n");
  process.exit(1);
});
