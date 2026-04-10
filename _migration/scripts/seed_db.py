"""
seed_db.py
─────────────────────────────────────────────────────────────
Toma el archivo base44_export.json generado por export_base44.js
y carga los datos en la base de datos del nuevo sistema.

USO (desde la carpeta _migration/api con el venv activado):
  python ../scripts/seed_db.py

O directamente:
  python _migration/scripts/seed_db.py

REQUISITOS:
  - FastAPI corriendo en localhost:8000 (para obtener el token admin)
  - Base de datos PostgreSQL corriendo
  - Credenciales de admin en _migration/api/.env.local
"""

import asyncio
import json
import os
import sys
from pathlib import Path

# ─── Config ──────────────────────────────────────────────
SCRIPT_DIR  = Path(__file__).parent
EXPORT_FILE = SCRIPT_DIR / "base44_export.json"
API_URL     = os.getenv("API_URL", "http://localhost:8000")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@josthom.com")
ADMIN_PASS  = os.getenv("ADMIN_PASS", "josthom2024")  # cambiá esto si usás otra contraseña


# ─── Helpers ─────────────────────────────────────────────
try:
    import httpx
except ImportError:
    print("❌ Falta httpx. Instalá con: pip install httpx")
    sys.exit(1)


async def login(client: httpx.AsyncClient) -> str:
    print(f"🔐 Iniciando sesión como {ADMIN_EMAIL}...")
    res = await client.post(f"{API_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASS,
    })
    res.raise_for_status()
    token = res.json()["access_token"]
    print("  ✓ Sesión iniciada")
    return token


async def seed_accommodations(client: httpx.AsyncClient, token: str, accommodations: list) -> None:
    headers = {"Authorization": f"Bearer {token}"}
    print(f"\n🏠 Cargando {len(accommodations)} alojamientos...")

    for acc in accommodations:
        payload = {
            "name":              acc.get("name", "Sin nombre"),
            "type":              acc.get("type", "cabaña"),
            "capacity":          acc.get("capacity", 4),
            "bedrooms":          acc.get("bedrooms", 1),
            "bathrooms":         acc.get("bathrooms", 1),
            "description":       acc.get("description", ""),
            "short_description": acc.get("short_description", ""),
            "main_image":        acc.get("main_image", ""),
            "gallery_images":    acc.get("gallery_images", []),
            "amenities":         acc.get("amenities", []),
            "price_per_night":   acc.get("price_per_night", 0),
            "is_featured":       acc.get("is_featured", False),
            "order":             acc.get("order", 0),
        }

        try:
            res = await client.post(f"{API_URL}/api/accommodations", json=payload, headers=headers)
            if res.status_code in (200, 201):
                print(f"  ✓ {payload['name']}")
            elif res.status_code == 409:
                print(f"  ~ {payload['name']} (ya existe, saltando)")
            else:
                print(f"  ✗ {payload['name']}: {res.status_code} {res.text[:100]}")
        except Exception as e:
            print(f"  ✗ {payload['name']}: {e}")


async def seed_gallery(client: httpx.AsyncClient, token: str, images: list) -> None:
    headers = {"Authorization": f"Bearer {token}"}
    print(f"\n🖼️  Cargando {len(images)} imágenes de galería...")

    for img in images:
        payload = {
            "image_url": img.get("image_url", ""),
            "title":     img.get("title", ""),
            "category":  img.get("category", "instalaciones"),
            "order":     img.get("order", 0),
        }

        if not payload["image_url"]:
            continue

        try:
            res = await client.post(f"{API_URL}/api/gallery", json=payload, headers=headers)
            if res.status_code in (200, 201):
                print(f"  ✓ {payload['title'] or payload['image_url'][:60]}")
            else:
                print(f"  ✗ {payload['title']}: {res.status_code}")
        except Exception as e:
            print(f"  ✗ {e}")


async def seed_content(client: httpx.AsyncClient, token: str, content_items: list) -> None:
    headers = {"Authorization": f"Bearer {token}"}
    print(f"\n📝 Cargando {len(content_items)} secciones de contenido...")

    for item in content_items:
        section = item.get("section", item.get("id", ""))
        if not section:
            continue

        payload = {
            "section":   section,
            "title":     item.get("title", ""),
            "subtitle":  item.get("subtitle", ""),
            "content":   item.get("content", ""),
            "image_url": item.get("image_url", item.get("imageUrl", "")),
        }

        try:
            res = await client.put(f"{API_URL}/api/content/{section}", json=payload, headers=headers)
            if res.status_code in (200, 201):
                print(f"  ✓ [{section}]")
            else:
                print(f"  ✗ [{section}]: {res.status_code}")
        except Exception as e:
            print(f"  ✗ [{section}]: {e}")


# ─── Main ────────────────────────────────────────────────
async def main():
    print("\n🌿 Seed DB — Josthom Eco Resort\n")

    if not EXPORT_FILE.exists():
        print(f"❌ No se encontró el archivo de exportación:")
        print(f"   {EXPORT_FILE}")
        print(f"\nPrimero corré: node _migration/scripts/export_base44.js\n")
        sys.exit(1)

    with open(EXPORT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"📂 Leyendo exportación del {data.get('exported_at', '?')}")
    print(f"   Alojamientos: {len(data.get('accommodations', []))}")
    print(f"   Galería:      {len(data.get('gallery_images', []))}")
    print(f"   Contenido:    {len(data.get('site_content', []))}")

    async with httpx.AsyncClient(timeout=30) as client:
        # Verificar que la API esté corriendo
        try:
            res = await client.get(f"{API_URL}/health")
        except Exception:
            print(f"\n❌ No se puede conectar a la API en {API_URL}")
            print("   Asegurate de que FastAPI esté corriendo: uvicorn app.main:app --reload\n")
            sys.exit(1)

        token = await login(client)

        if data.get("accommodations"):
            await seed_accommodations(client, token, data["accommodations"])

        if data.get("gallery_images"):
            await seed_gallery(client, token, data["gallery_images"])

        if data.get("site_content"):
            await seed_content(client, token, data["site_content"])

    print("\n✅ ¡Seed completado!\n")


if __name__ == "__main__":
    asyncio.run(main())
