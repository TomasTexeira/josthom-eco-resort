from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, exists, func
from sqlalchemy.orm import selectinload
from datetime import date, timedelta
from ..database import get_db
from ..models.booking import Booking, BookingStatus
from ..models.accommodation import Accommodation
from ..schemas.booking import BookingCreate, BookingUpdate, BookingOut, PriceCalculation, PriceResponse, AvailabilityCheck
from ..services.pricing import calculate_price
from .deps import require_staff, require_admin

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


# ─── Endpoints públicos ────────────────────────────────────

@router.post("/check-availability")
async def check_availability(data: AvailabilityCheck, db: AsyncSession = Depends(get_db)):
    """
    Verifica disponibilidad de un alojamiento para un rango de fechas.
    Usa SQL puro (EXISTS) para no cargar objetos ORM a la sesión, evitando
    conflictos de lazy-loading durante el flush posterior.
    Las fechas ISO 'YYYY-MM-DD' son comparables como strings.
    """
    has_conflict = await db.scalar(
        select(exists().where(
            and_(
                Booking.accommodation_id == data.accommodation_id,
                Booking.status.in_([BookingStatus.pending, BookingStatus.confirmed]),
                # Superposición de rangos con 1 día de limpieza:
                # Una reserva que hace checkout el día X bloquea ese día (>= en lugar de >).
                # Ejemplo: checkout Apr 12 → el siguiente check-in más temprano es Apr 13.
                Booking.check_in < data.check_out,
                Booking.check_out >= data.check_in,
            )
        ))
    )
    return {"available": not has_conflict}


@router.get("/unavailable-dates/{accommodation_id}")
async def get_unavailable_dates(accommodation_id: str, db: AsyncSession = Depends(get_db)):
    """Devuelve todas las fechas ocupadas para el calendario (solo columnas, sin relaciones)."""
    result = await db.execute(
        select(Booking.check_in, Booking.check_out).where(
            and_(
                Booking.accommodation_id == accommodation_id,
                Booking.status.in_([BookingStatus.pending, BookingStatus.confirmed]),
            )
        )
    )
    rows = result.all()  # list of (check_in, check_out) tuples — sin ORM objects

    blocked = []
    for check_in_str, check_out_str in rows:
        current = date.fromisoformat(check_in_str[:10])
        # check_out inclusive: ese día queda bloqueado por limpieza.
        # El próximo huésped puede hacer check-in recién al día siguiente.
        check_out_blocked = date.fromisoformat(check_out_str[:10])
        while current <= check_out_blocked:
            blocked.append(current.isoformat())
            current += timedelta(days=1)

    return {"blocked_dates": blocked}


@router.post("/calculate-price", response_model=PriceResponse)
async def calculate_booking_price(data: PriceCalculation):
    """Calcula el precio antes de confirmar la reserva."""
    try:
        check_in = date.fromisoformat(data.check_in)
        check_out = date.fromisoformat(data.check_out)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Usar YYYY-MM-DD")

    if check_in >= check_out:
        raise HTTPException(status_code=400, detail="La fecha de check-out debe ser posterior al check-in")

    from ..core.config import settings
    nights = (check_out - check_in).days
    if nights < settings.MIN_NIGHTS:
        raise HTTPException(status_code=400, detail=f"Mínimo {settings.MIN_NIGHTS} noches")

    result = calculate_price(check_in, check_out, data.number_of_guests)
    return PriceResponse(**result)


@router.post("", response_model=BookingOut)
async def create_booking(data: BookingCreate, db: AsyncSession = Depends(get_db)):
    """Crea una nueva reserva (endpoint público para el formulario web)."""

    # 1. Verificar que el alojamiento existe con EXISTS para no cargar el objeto
    #    a la sesión (evita back-reference lazy-load durante flush).
    acc_exists = await db.scalar(
        select(exists().where(Accommodation.id == data.accommodation_id))
    )
    if not acc_exists:
        raise HTTPException(status_code=404, detail="Alojamiento no encontrado")

    # 2. Verificar disponibilidad usando SQL directo (también evita cargar ORM objects)
    has_conflict = await db.scalar(
        select(exists().where(
            and_(
                Booking.accommodation_id == data.accommodation_id,
                Booking.status.in_([BookingStatus.pending, BookingStatus.confirmed]),
                Booking.check_in < data.check_out,
                Booking.check_out > data.check_in,
            )
        ))
    )
    if has_conflict:
        raise HTTPException(status_code=409, detail="Las fechas seleccionadas no están disponibles")

    # 3. Validar fechas y mínimo de noches
    from ..core.config import settings as _settings
    check_in = date.fromisoformat(data.check_in[:10])
    check_out = date.fromisoformat(data.check_out[:10])
    if check_out <= check_in:
        raise HTTPException(status_code=400, detail="El check-out debe ser posterior al check-in")
    nights = (check_out - check_in).days
    if nights < _settings.MIN_NIGHTS:
        raise HTTPException(status_code=400, detail=f"La estadía mínima es de {_settings.MIN_NIGHTS} noches")

    # 4. Calcular precio
    price_data = calculate_price(check_in, check_out, data.number_of_guests)

    # 4. Crear la reserva
    booking = Booking(
        **data.model_dump(),
        total_price=price_data["total_price"],
        deposit_amount=price_data["deposit_amount"],
        balance_amount=price_data["balance_amount"],
    )
    db.add(booking)
    await db.flush()  # INSERT dentro de la transacción

    # 5. Generar preferencia de pago en Mercado Pago
    from ..services.mercadopago_service import create_deposit_preference
    from ..models.payment import Payment, PaymentType, PaymentStatus

    mp_data = create_deposit_preference(
        booking_id=booking.id,
        accommodation_name=booking.accommodation_name,
        check_in=booking.check_in,
        check_out=booking.check_out,
        guest_name=booking.guest_name,
        guest_email=booking.guest_email,
        amount=booking.deposit_amount,
    )

    payment = Payment(
        booking_id=booking.id,
        type=PaymentType.deposit,
        amount=booking.deposit_amount,
        status=PaymentStatus.pending,
        mp_preference_id=mp_data["preference_id"],
        mp_external_reference=booking.id,
        payment_url=mp_data["payment_url"],
    )
    db.add(payment)
    await db.flush()

    # 6. Recargar con selectinload para serializar
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.payments))
        .where(Booking.id == booking.id)
    )
    booking = result.scalar_one()

    # 7. Emails (async, no bloquean la respuesta aunque fallen)
    from ..services.email import notify_booking_created
    booking_dict = {
        "guest_name":         booking.guest_name,
        "guest_email":        booking.guest_email,
        "guest_phone":        booking.guest_phone or "",
        "accommodation_name": booking.accommodation_name,
        "check_in":           booking.check_in,
        "check_out":          booking.check_out,
        "number_of_guests":   booking.number_of_guests,
        "total_price":        booking.total_price,
        "deposit_amount":     booking.deposit_amount,
        "balance_amount":     booking.balance_amount,
        "special_requests":   booking.special_requests,
    }
    import asyncio
    asyncio.create_task(notify_booking_created(booking_dict, mp_data["payment_url"]))

    return booking


# ─── Endpoints protegidos (staff) ─────────────────────────

@router.get("", response_model=list[BookingOut])
async def list_bookings(
    status: BookingStatus | None = Query(None),
    accommodation_id: str | None = Query(None),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_staff),
):
    query = (
        select(Booking)
        .options(selectinload(Booking.payments))
        .order_by(Booking.created_at.desc())
    )

    if status:
        query = query.where(Booking.status == status)
    if accommodation_id:
        query = query.where(Booking.accommodation_id == accommodation_id)
    if search:
        term = f"%{search}%"
        query = query.where(
            or_(
                Booking.guest_name.ilike(term),
                Booking.guest_email.ilike(term),
                Booking.guest_phone.ilike(term),
            )
        )

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{booking_id}", response_model=BookingOut)
async def get_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_staff),
):
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.payments))
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return booking


@router.put("/{booking_id}", response_model=BookingOut)
async def update_booking(
    booking_id: str,
    data: BookingUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_staff),
):
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.payments))
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(booking, field, value)

    # Si cambian las fechas o huéspedes, recalcular precio
    if any(f in data.model_dump(exclude_unset=True) for f in ["check_in", "check_out", "number_of_guests"]):
        ci = date.fromisoformat(booking.check_in[:10])
        co = date.fromisoformat(booking.check_out[:10])
        price_data = calculate_price(ci, co, booking.number_of_guests)
        booking.total_price = price_data["total_price"]
        booking.deposit_amount = price_data["deposit_amount"]
        booking.balance_amount = price_data["balance_amount"]

    return booking


@router.delete("/{booking_id}", dependencies=[Depends(require_admin)])
async def delete_booking(booking_id: str, db: AsyncSession = Depends(get_db)):
    # Cargar payments también para que SQLAlchemy pueda aplicar cascade delete
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.payments))
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    await db.delete(booking)
    await db.flush()
    return {"ok": True}
