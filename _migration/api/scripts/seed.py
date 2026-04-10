"""
Seed inicial de la base de datos.
Crea el usuario admin y el contenido por defecto de todas las secciones.

Uso:
  cd api
  python scripts/seed.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import AsyncSessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.content import SiteContent
from app.core.security import hash_password


INITIAL_CONTENT = [
    { "section": "hero",       "title": "Josthom Eco Resort",        "subtitle": "Naturaleza, tranquilidad y el Río Uruguay en Villa Paranacito",  "image_url": None },
    { "section": "about",      "title": "Sobre nosotros",             "subtitle": "Un rincón único en Entre Ríos",                                   "content": "Josthom Eco Resort es un complejo de 6 cabañas a orillas del Arroyo Sagastume, en Villa Paranacito. Un lugar para desconectarse y reconectarse con la naturaleza." },
    { "section": "experience", "title": "Viví la experiencia",        "subtitle": "Río, fauna y aventura",                                           "content": "Cada día en Josthom es diferente. Pescá, kayak, caminá entre carpinchos o simplemente disfrutá del silencio del campo entrerriano." },
    { "section": "location",   "title": "¿Cómo llegar?",             "subtitle": "Villa Paranacito, Entre Ríos",                                    "content": "Seguí la Ruta Nacional 12 hasta Villa Paranacito, a 163km de Buenos Aires. Al llegar tomá el camino costero hacia el Arroyo Sagastume." },
    { "section": "contact",    "title": "Contacto",                   "subtitle": "Estamos para ayudarte",                                           "content": None },
    { "section": "gallery",    "title": "Galería",                    "subtitle": "Las mejores fotos del complejo",                                   "content": None },
]


async def seed():
    # Crear tablas si no existen
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        from sqlalchemy import select

        # ─── Usuario admin ──────────────────────────────────
        result = await db.execute(select(User).where(User.email == "admin@josthom.com.ar"))
        existing = result.scalar_one_or_none()

        if not existing:
            admin = User(
                email="admin@josthom.com.ar",
                name="Administrador",
                hashed_password=hash_password("josthom2024!"),  # ⚠️ Cambiar en producción
                role=UserRole.admin,
            )
            db.add(admin)
            print("✅ Usuario admin creado: admin@josthom.com.ar / josthom2024!")
            print("   ⚠️  CAMBIÁ la contraseña después del primer login!")
        else:
            print("ℹ  Usuario admin ya existe, no se modificó.")

        # ─── Contenido por defecto ──────────────────────────
        for content_data in INITIAL_CONTENT:
            result = await db.execute(
                select(SiteContent).where(SiteContent.section == content_data["section"])
            )
            existing_c = result.scalar_one_or_none()
            if not existing_c:
                db.add(SiteContent(**content_data))
                print(f"✅ Contenido creado: sección '{content_data['section']}'")
            else:
                print(f"ℹ  Contenido '{content_data['section']}' ya existe.")

        await db.commit()

    await engine.dispose()
    print("\n🌱 Seed completado!")


if __name__ == "__main__":
    asyncio.run(seed())
