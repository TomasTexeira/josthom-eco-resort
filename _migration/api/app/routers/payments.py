"""
Endpoints de Mercado Pago.
- POST /api/payments/create-preference/{booking_id}  → crea preferencia MP
- POST /api/payments/webhook/mercadopago             → recibe notificaciones de MP
- GET  /api/payments/{booking_id}                    → lista pagos de una reserva
"""
import hashlib
import hmac
import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional

from ..database import get_db
from ..models.booking import Booking, BookingStatus
from ..models.payment import Payment, PaymentType, PaymentStatus
from ..core.config import settings
from ..services.mercadopago_service import create_deposit_preference, get_payment_info
from ..services.email import notify_booking_confirmed
from .deps import require_staff

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payments", tags=["payments"])


# ─── Crear preferencia de pago ─────────────────────────────────────────────────

@router.post("/create-preference/{booking_id}")
async def create_payment_preference(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Crea (o recrea) la preferencia de MP para la seña de una reserva.
    Público: el huésped puede entrar desde el link del email.
    """
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.payments))
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    if booking.status == BookingStatus.confirmed:
        raise HTTPException(status_code=400, detail="Esta reserva ya está confirmada")

    if booking.status == BookingStatus.cancelled:
        raise HTTPException(status_code=400, detail="Esta reserva fue cancelada")

    # Generar preferencia en MP
    mp_data = create_deposit_preference(
        booking_id=booking_id,
        accommodation_name=booking.accommodation_name,
        check_in=booking.check_in,
        check_out=booking.check_out,
        guest_name=booking.guest_name,
        guest_email=booking.guest_email,
        amount=booking.deposit_amount,
    )

    # Crear o actualizar registro de Payment
    existing_payment = next(
        (p for p in booking.payments if p.type == PaymentType.deposit), None
    )
    if existing_payment:
        existing_payment.mp_preference_id = mp_data["preference_id"]
        existing_payment.payment_url = mp_data["payment_url"]
    else:
        payment = Payment(
            booking_id=booking_id,
            type=PaymentType.deposit,
            amount=booking.deposit_amount,
            status=PaymentStatus.pending,
            mp_preference_id=mp_data["preference_id"],
            mp_external_reference=booking_id,
            payment_url=mp_data["payment_url"],
        )
        db.add(payment)

    return {"payment_url": mp_data["payment_url"], "preference_id": mp_data["preference_id"]}


# ─── Webhook de Mercado Pago ────────────────────────────────────────────────────

@router.post("/webhook/mercadopago")
async def mercadopago_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_signature: Optional[str] = Header(None),
    x_request_id: Optional[str] = Header(None),
):
    """
    MP llama a este endpoint al procesar un pago.
    Documentación: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
    """
    body = await request.body()

    # ── Verificar firma HMAC-SHA256 ────────────────────────────────────────────
    if x_signature and settings.MP_WEBHOOK_SECRET:
        try:
            parts = dict(item.split("=", 1) for item in x_signature.split(","))
            ts = parts.get("ts", "")
            received_hash = parts.get("v1", "")
            data_id = request.query_params.get("data.id", "")
            signed_template = f"id:{data_id};request-id:{x_request_id};ts:{ts};"
            expected = hmac.new(
                settings.MP_WEBHOOK_SECRET.encode(),
                signed_template.encode(),
                hashlib.sha256,
            ).hexdigest()
            if not hmac.compare_digest(expected, received_hash):
                logger.warning("[WEBHOOK] Firma MP inválida")
                raise HTTPException(status_code=400, detail="Firma inválida")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[WEBHOOK] Error verificando firma: {e}")

    # ── Procesar notificación ──────────────────────────────────────────────────
    try:
        data = json.loads(body)
    except Exception:
        return {"status": "ok"}  # MP a veces envía pings vacíos

    topic = data.get("type") or data.get("topic")
    logger.info(f"[WEBHOOK] MP notification: type={topic}")

    if topic == "payment":
        mp_payment_id = str(data.get("data", {}).get("id") or data.get("id", ""))
        if not mp_payment_id:
            return {"status": "ok"}

        await _process_payment(mp_payment_id, db)

    return {"status": "ok"}


async def _process_payment(mp_payment_id: str, db: AsyncSession) -> None:
    """Verifica el pago en MP y actualiza la reserva si corresponde."""
    try:
        payment_info = get_payment_info(mp_payment_id)
    except Exception as e:
        logger.error(f"[WEBHOOK] Error consultando pago {mp_payment_id} en MP: {e}")
        return

    status     = payment_info.get("status")
    ext_ref    = payment_info.get("external_reference")  # booking_id
    mp_status  = payment_info.get("status_detail", "")

    logger.info(f"[WEBHOOK] Pago {mp_payment_id}: status={status} ref={ext_ref}")

    if not ext_ref:
        return

    # Buscar la reserva
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.payments))
        .where(Booking.id == ext_ref)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        logger.warning(f"[WEBHOOK] Reserva {ext_ref} no encontrada")
        return

    # Buscar o crear el Payment en nuestra DB
    payment = next((p for p in booking.payments if p.type == PaymentType.deposit), None)
    if not payment:
        payment = Payment(
            booking_id=booking.id,
            type=PaymentType.deposit,
            amount=booking.deposit_amount,
        )
        db.add(payment)

    payment.mp_payment_id  = mp_payment_id
    payment.mp_status_detail = mp_status

    if status == "approved":
        payment.status = PaymentStatus.approved
        from datetime import datetime, timezone
        payment.paid_at = datetime.now(timezone.utc)

        # Confirmar reserva
        if booking.status != BookingStatus.confirmed:
            booking.status = BookingStatus.confirmed
            logger.info(f"[WEBHOOK] Reserva {booking.id} CONFIRMADA")

            # Emails de confirmación
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
            await notify_booking_confirmed(booking_dict)

    elif status in ("rejected", "cancelled"):
        payment.status = PaymentStatus.rejected

    elif status in ("in_process", "pending", "authorized"):
        payment.status = PaymentStatus.in_process


# ─── Consultar pagos de una reserva ────────────────────────────────────────────

@router.get("/{booking_id}")
async def get_booking_payments(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_staff),
):
    result = await db.execute(select(Payment).where(Payment.booking_id == booking_id))
    return result.scalars().all()
