"""
Script de migración de datos desde Base44 → PostgreSQL

Uso:
  1. Crear .env con DATABASE_URL y BASE44_APP_ID + BASE44_APP_BASE_URL
  2. pip install httpx asyncpg sqlalchemy[asyncio] python-dotenv
  3. python migrate_from_base44.py [--export-only] [--import-only path/to/export]

Fases:
  A. EXPORTAR: Lee datos de Base44 via la API REST y los guarda en JSON
  B. IMPORTAR: Lee el JSON y lo inserta en PostgreSQL

El script es idempotente: si un registro ya existe (mismo ID), lo actualiza.
"""

import asyncio
import json
import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

# ─── Configuración ────────────────────────────────────────
BASE44_APP_ID = os.getenv("VITE_BASE44_APP_ID") or os.getenv("BASE44_APP_ID")
BASE44_BASE_URL = os.getenv("VITE_BASE44_APP_BASE_URL") or os.getenv("BASE44_APP_BASE_URL")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://josthom:password@localhost:5432/josthom")
EXPORT_DIR = Path("./migration_export")

# ─── Helpers ──────────────────────────────────────────────

def log(msg: str, level: str = "INFO"):
    symbols = {"INFO": "ℹ", "OK": "✅", "ERROR": "❌", "WARN": "⚠️"}
    print(f"[{symbols.get(level, level)}] {msg}")


def save_json(name: str, data: list[dict]):
    EXPORT_DIR.mkdir(exist_ok=True)
    path = EXPORT_DIR / f"{name}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)
    log(f"Guardado: {path} ({len(data)} registros)", "OK")
    return path


def load_json(name: str) -> list[dict]:
    path = EXPORT_DIR / f"{name}.json"
    if not path.exists():
        log(f"No se encontró {path}", "ERROR")
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ─── FASE A: Exportar desde Base44 ────────────────────────

async def export_from_base44():
    if not BASE44_BASE_URL:
        log("BASE44_APP_BASE_URL no configurado. Asegurate de tener .env con VITE_BASE44_APP_BASE_URL", "ERROR")
        sys.exit(1)

    log(f"Conectando a Base44: {BASE44_BASE_URL}")

    headers = {
        "Content-Type": "application/json",
        "X-App-Id": BASE44_APP_ID or "",
    }

    async with httpx.AsyncClient(base_url=BASE44_BASE_URL, headers=headers, timeout=30) as client:

        # Exportar Accommodations
        log("Exportando Accommodations...")
        try:
            resp = await client.get("/api/entities/Accommodation/list", params={"limit": 100})
            resp.raise_for_status()
            data = resp.json()
            accommodations = data if isinstance(data, list) else data.get("items", data.get("data", []))
            save_json("accommodations", accommodations)
        except Exception as e:
            log(f"Error al exportar Accommodations: {e}", "ERROR")
            accommodations = []

        # Exportar Bookings
        log("Exportando Bookings...")
        bookings = []
        page = 1
        while True:
            try:
                resp = await client.get("/api/entities/Booking/list", params={"limit": 100, "page": page})
                resp.raise_for_status()
                data = resp.json()
                batch = data if isinstance(data, list) else data.get("items", data.get("data", []))
                if not batch:
                    break
                bookings.extend(batch)
                log(f"  Bookings página {page}: {len(batch)} registros")
                if len(batch) < 100:
                    break
                page += 1
            except Exception as e:
                log(f"Error al exportar Bookings (página {page}): {e}", "ERROR")
                break

        save_json("bookings", bookings)

        # Exportar GalleryImages
        log("Exportando GalleryImages...")
        try:
            resp = await client.get("/api/entities/GaleryImage/list", params={"limit": 500})
            resp.raise_for_status()
            data = resp.json()
            images = data if isinstance(data, list) else data.get("items", data.get("data", []))
            save_json("gallery_images", images)
        except Exception as e:
            log(f"Error al exportar GalleryImages: {e}", "ERROR")

        # Exportar SiteContent
        log("Exportando SiteContent...")
        try:
            resp = await client.get("/api/entities/SiteContent/list", params={"limit": 50})
            resp.raise_for_status()
            data = resp.json()
            content = data if isinstance(data, list) else data.get("items", data.get("data", []))
            save_json("site_content", content)
        except Exception as e:
            log(f"Error al exportar SiteContent: {e}", "ERROR")

    log(f"Exportación completa. Archivos en: {EXPORT_DIR.absolute()}", "OK")


# ─── FASE B: Importar a PostgreSQL ────────────────────────

def fix_date(date_str: str | None) -> str | None:
    """Arregla fechas corruptas (equivalente a fixCorruptedDates Deno function)."""
    if not date_str:
        return None
    import re
    match = re.search(r"(\d{4}-\d{2}-\d{2})", str(date_str))
    if match:
        return match.group(1)
    return None


async def import_to_postgres():
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from sqlalchemy.dialects.postgresql import insert as pg_insert

    # Importar modelos
    sys.path.insert(0, str(Path(__file__).parent.parent / "api"))
    from app.database import Base
    from app.models.accommodation import Accommodation
    from app.models.booking import Booking, BookingStatus, BookingSource
    from app.models.gallery import GalleryImage
    from app.models.content import SiteContent

    log(f"Conectando a PostgreSQL: {DATABASE_URL[:50]}...")
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log("Tablas creadas/verificadas", "OK")

    async with async_session() as db:

        # ─── Accommodations ─────────────────────────────────
        accommodations = load_json("accommodations")
        log(f"Importando {len(accommodations)} alojamientos...")
        imported_acc = 0
        for acc in accommodations:
            obj = Accommodation(
                id=acc.get("id") or acc.get("_id") or str(__import__("uuid").uuid4()),
                name=acc.get("name", "Sin nombre"),
                type=acc.get("type", "cabaña"),
                capacity=int(acc.get("capacity", 2) or 2),
                bedrooms=int(acc.get("bedrooms", 1) or 1),
                bathrooms=int(acc.get("bathrooms", 1) or 1),
                description=acc.get("description"),
                short_description=acc.get("short_description"),
                main_image=acc.get("main_image"),
                gallery_images=acc.get("gallery_images") or [],
                amenities=acc.get("amenities") or [],
                booking_url=acc.get("booking_url"),
                price_per_night=acc.get("price_per_night"),
                is_featured=bool(acc.get("is_featured", False)),
                order=int(acc.get("order", 0) or 0),
            )
            await db.merge(obj)
            imported_acc += 1
        await db.commit()
        log(f"Alojamientos importados: {imported_acc}", "OK")

        # ─── Bookings ────────────────────────────────────────
        bookings = load_json("bookings")
        log(f"Importando {len(bookings)} reservas...")
        imported_b = 0
        skipped_b = 0
        for b in bookings:
            check_in = fix_date(b.get("check_in"))
            check_out = fix_date(b.get("check_out"))
            if not check_in or not check_out:
                log(f"  Reserva {b.get('id', '?')} saltada: fechas inválidas", "WARN")
                skipped_b += 1
                continue

            # Mapear status
            status_map = {
                "pending": BookingStatus.pending,
                "confirmed": BookingStatus.confirmed,
                "cancelled": BookingStatus.cancelled,
                "completed": BookingStatus.completed,
            }
            status = status_map.get(b.get("status", "pending"), BookingStatus.pending)

            # Mapear source
            source_map = {
                "web": BookingSource.web,
                "airbnb": BookingSource.airbnb,
                "booking": BookingSource.booking,
                "phone": BookingSource.phone,
                "whatsapp": BookingSource.whatsapp,
            }
            source = source_map.get(b.get("source", "web"), BookingSource.web)

            total = float(b.get("total_price", 0) or 0)
            deposit = float(b.get("deposit_amount") or b.get("deposit") or (total * 0.25))
            balance = float(b.get("balance_amount") or b.get("balance") or (total * 0.75))

            obj = Booking(
                id=b.get("id") or b.get("_id") or str(__import__("uuid").uuid4()),
                accommodation_id=b.get("accommodation_id", ""),
                accommodation_name=b.get("accommodation_name", ""),
                guest_name=b.get("guest_name", ""),
                guest_email=b.get("guest_email", ""),
                guest_phone=b.get("guest_phone"),
                number_of_guests=int(b.get("number_of_guests", 2) or 2),
                check_in=check_in,
                check_out=check_out,
                total_price=total,
                deposit_amount=deposit,
                balance_amount=balance,
                status=status,
                source=source,
                special_requests=b.get("special_requests"),
            )
            await db.merge(obj)
            imported_b += 1

        await db.commit()
        log(f"Reservas importadas: {imported_b} | Saltadas: {skipped_b}", "OK")

        # ─── GalleryImages ───────────────────────────────────
        images = load_json("gallery_images")
        log(f"Importando {len(images)} imágenes de galería...")
        imported_img = 0
        for img in images:
            url = img.get("image_url") or img.get("url")
            if not url:
                continue
            obj = GalleryImage(
                id=img.get("id") or img.get("_id") or str(__import__("uuid").uuid4()),
                image_url=url,
                title=img.get("title"),
                category=img.get("category", "campo"),
                order=int(img.get("order", 0) or 0),
            )
            await db.merge(obj)
            imported_img += 1
        await db.commit()
        log(f"Imágenes importadas: {imported_img}", "OK")

        # ─── SiteContent ─────────────────────────────────────
        content = load_json("site_content")
        log(f"Importando {len(content)} bloques de contenido...")
        imported_c = 0
        for c in content:
            section = c.get("section")
            if not section:
                continue
            obj = SiteContent(
                id=c.get("id") or c.get("_id") or str(__import__("uuid").uuid4()),
                section=section,
                title=c.get("title"),
                subtitle=c.get("subtitle"),
                content=c.get("content"),
                image_url=c.get("image_url"),
            )
            await db.merge(obj)
            imported_c += 1
        await db.commit()
        log(f"Contenido importado: {imported_c}", "OK")

    await engine.dispose()
    log("¡Migración completada con éxito!", "OK")


# ─── Entry point ──────────────────────────────────────────

async def main():
    parser = argparse.ArgumentParser(description="Migración Base44 → PostgreSQL")
    parser.add_argument("--export-only", action="store_true", help="Solo exportar datos de Base44")
    parser.add_argument("--import-only", action="store_true", help="Solo importar desde JSON al export dir")
    args = parser.parse_args()

    if args.export_only:
        await export_from_base44()
    elif args.import_only:
        await import_to_postgres()
    else:
        # Correr ambas fases
        log("=== FASE A: Exportar desde Base44 ===")
        await export_from_base44()
        log("")
        log("=== FASE B: Importar a PostgreSQL ===")
        await import_to_postgres()


if __name__ == "__main__":
    asyncio.run(main())
