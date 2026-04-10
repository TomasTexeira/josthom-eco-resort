"""
seed_accommodations.py
─────────────────────────────────────────────────────────────
Carga las cabañas de Josthom en la base de datos nueva.
Las fotos (main_image / gallery_images) se pueden agregar
después desde el panel de administración.

USO (con FastAPI corriendo en localhost:8000):
  python _migration/scripts/seed_accommodations.py

Variables de entorno opcionales:
  API_URL     = http://localhost:8000
  ADMIN_EMAIL = admin@josthom.com
  ADMIN_PASS  = josthom2024
"""

import asyncio, os, sys

try:
    import httpx
except ImportError:
    print("❌ Falta httpx. Instalá con: pip install httpx --break-system-packages")
    sys.exit(1)

API_URL     = os.getenv("API_URL",     "http://localhost:8000")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@josthom.com")
ADMIN_PASS  = os.getenv("ADMIN_PASS",  "josthom2024")

# ─── Datos de las cabañas ────────────────────────────────────
# Completá/modificá estos datos según tu situación real.
# Las fotos (main_image / gallery_images) las agregás luego
# desde el panel admin → Alojamientos → Editar.

ACCOMMODATIONS = [
    {
        "name": "Cabaña Ñandú",
        "type": "cabaña",
        "capacity": 4,
        "bedrooms": 2,
        "bathrooms": 1,
        "price_per_night": 50000,
        "short_description": "Cabaña para 4 personas a orillas del arroyo.",
        "description": (
            "Amplia cabaña para 4 personas con 2 dormitorios, baño completo, "
            "cocina equipada, living comedor y galería con parrilla. "
            "A pocos metros del Arroyo Sagastume."
        ),
        "amenities": ["WiFi", "Aire acondicionado", "Parrilla", "Cocina equipada", "Ropa de cama"],
        "main_image": "",      # ← agregar luego desde admin
        "gallery_images": [],  # ← agregar luego desde admin
        "is_featured": True,
        "order": 1,
    },
    {
        "name": "Cabaña Carpincho",
        "type": "cabaña",
        "capacity": 4,
        "bedrooms": 2,
        "bathrooms": 1,
        "price_per_night": 50000,
        "short_description": "Cabaña para 4 personas rodeada de naturaleza.",
        "description": (
            "Cabaña para 4 personas con 2 dormitorios, baño completo, "
            "cocina equipada y galería con parrilla. "
            "Ideal para familias o grupos de amigos."
        ),
        "amenities": ["WiFi", "Aire acondicionado", "Parrilla", "Cocina equipada", "Ropa de cama"],
        "main_image": "",
        "gallery_images": [],
        "is_featured": True,
        "order": 2,
    },
    {
        "name": "Cabaña Yacaré",
        "type": "cabaña",
        "capacity": 2,
        "bedrooms": 1,
        "bathrooms": 1,
        "price_per_night": 40000,
        "short_description": "Cabaña romántica para 2 personas.",
        "description": (
            "Acogedora cabaña para 2 personas con dormitorio doble, "
            "baño completo, kitchenette y galería privada con parrilla. "
            "Perfecta para parejas."
        ),
        "amenities": ["WiFi", "Aire acondicionado", "Parrilla", "Kitchenette", "Ropa de cama"],
        "main_image": "",
        "gallery_images": [],
        "is_featured": False,
        "order": 3,
    },
    {
        "name": "Cabaña Coipu",
        "type": "cabaña",
        "capacity": 2,
        "bedrooms": 1,
        "bathrooms": 1,
        "price_per_night": 40000,
        "short_description": "Cabaña tranquila para 2 personas.",
        "description": (
            "Cabaña para 2 personas rodeada de vegetación nativa. "
            "Dormitorio doble, baño, kitchenette y galería con parrilla."
        ),
        "amenities": ["WiFi", "Aire acondicionado", "Parrilla", "Kitchenette", "Ropa de cama"],
        "main_image": "",
        "gallery_images": [],
        "is_featured": False,
        "order": 4,
    },
    {
        "name": "Casa del Río",
        "type": "casa",
        "capacity": 8,
        "bedrooms": 3,
        "bathrooms": 2,
        "price_per_night": 90000,
        "short_description": "Casa grande para grupos y familias.",
        "description": (
            "Casa completa para hasta 8 personas, con 3 dormitorios, 2 baños, "
            "cocina completa, living, comedor y amplia galería con parrilla y fogón. "
            "Ideal para grupos grandes o eventos familiares."
        ),
        "amenities": ["WiFi", "Aire acondicionado", "Parrilla", "Fogón", "Cocina equipada", "Ropa de cama", "Smart TV"],
        "main_image": "",
        "gallery_images": [],
        "is_featured": True,
        "order": 5,
    },
]

# ─── Main ────────────────────────────────────────────────────
async def main():
    print("\n🌿 Seed: Alojamientos — Josthom Eco Resort\n")

    async with httpx.AsyncClient(timeout=30) as client:
        # Health check
        try:
            await client.get(f"{API_URL}/health")
        except Exception:
            print(f"❌ No se puede conectar a {API_URL}")
            print("   Iniciá FastAPI: cd _migration/api && uvicorn app.main:app --reload\n")
            sys.exit(1)

        # Login
        res = await client.post(f"{API_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
        res.raise_for_status()
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"✓ Sesión iniciada como {ADMIN_EMAIL}\n")

        # Verificar cuántas hay ya
        existing = await client.get(f"{API_URL}/api/accommodations")
        existing_names = {a["name"] for a in existing.json()} if existing.is_success else set()
        if existing_names:
            print(f"ℹ️  Ya existen {len(existing_names)} alojamientos: {', '.join(existing_names)}")
            print("   Los que ya existen serán saltados.\n")

        # Insertar
        created = 0
        for acc in ACCOMMODATIONS:
            if acc["name"] in existing_names:
                print(f"  ~ {acc['name']} (ya existe, saltando)")
                continue
            res = await client.post(f"{API_URL}/api/accommodations",
                json=acc, headers=headers)
            if res.status_code in (200, 201):
                print(f"  ✓ {acc['name']} — ${acc['price_per_night']:,}/noche")
                created += 1
            else:
                print(f"  ✗ {acc['name']}: {res.status_code} {res.text[:80]}")

    print(f"\n✅ {created} alojamiento(s) creado(s).")
    print("\nPara agregar las fotos:")
    print("  → Panel admin → Alojamientos → Editar cada cabaña")
    print("  → Pegá la URL de la foto del NAS en 'URL imagen principal'\n")


if __name__ == "__main__":
    asyncio.run(main())
