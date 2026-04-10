"""
Tareas programadas para gestión de reservas.
Equivalentes a las funciones Deno de Base44:
  - autoCompleteBookings
  - autoCancelExpiredBookings
"""
from celery import shared_task
from datetime import date
import logging

logger = logging.getLogger(__name__)


@shared_task(name="app.tasks.bookings.auto_complete_bookings", bind=True, max_retries=3)
def auto_complete_bookings(self):
    """
    Marca como 'completed' las reservas confirmadas cuyo check-out ya pasó.
    Equivalente a: base44/functions/autoCompleteBookings/entry.ts
    """
    import asyncio
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import select, and_
    from ..database import AsyncSessionLocal
    from ..models.booking import Booking, BookingStatus

    async def _run():
        today = date.today().isoformat()
        completed_ids = []

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Booking).where(
                    and_(
                        Booking.status == BookingStatus.confirmed,
                        Booking.check_out <= today,
                    )
                )
            )
            bookings = result.scalars().all()

            for booking in bookings:
                booking.status = BookingStatus.completed
                completed_ids.append(booking.id)

            await db.commit()

        logger.info(f"auto_complete_bookings: {len(completed_ids)} reservas completadas")
        return {"completed": len(completed_ids), "ids": completed_ids}

    try:
        return asyncio.run(_run())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@shared_task(name="app.tasks.bookings.auto_cancel_expired_bookings", bind=True, max_retries=3)
def auto_cancel_expired_bookings(self):
    """
    Cancela reservas pendientes cuyo check-out ya pasó.
    Equivalente a: base44/functions/autoCancelExpiredBookings/entry.ts
    """
    import asyncio
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import select, and_
    from ..database import AsyncSessionLocal
    from ..models.booking import Booking, BookingStatus

    async def _run():
        today = date.today().isoformat()
        cancelled_ids = []

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Booking).where(
                    and_(
                        Booking.status == BookingStatus.pending,
                        Booking.check_out < today,
                    )
                )
            )
            bookings = result.scalars().all()

            for booking in bookings:
                booking.status = BookingStatus.cancelled
                cancelled_ids.append(booking.id)

            await db.commit()

        logger.info(f"auto_cancel_expired_bookings: {len(cancelled_ids)} reservas canceladas")
        return {"cancelled": len(cancelled_ids), "ids": cancelled_ids}

    try:
        return asyncio.run(_run())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@shared_task(name="app.tasks.bookings.cancel_unpaid_bookings", bind=True, max_retries=3)
def cancel_unpaid_bookings(self):
    """
    Cancela reservas pendientes de pago que superaron el plazo (BOOKING_PAYMENT_DEADLINE_HOURS).
    Se ejecuta cada hora. Si pasaron X horas desde created_at y la reserva sigue en
    estado 'pending' (ningún pago aprobado), se cancela automáticamente.
    """
    import asyncio
    from datetime import datetime, timezone, timedelta
    from sqlalchemy import select, and_
    from sqlalchemy.orm import selectinload
    from ..database import AsyncSessionLocal
    from ..models.booking import Booking, BookingStatus
    from ..models.payment import PaymentStatus
    from ..core.config import settings

    async def _run():
        deadline_hours = settings.BOOKING_PAYMENT_DEADLINE_HOURS
        cutoff = datetime.now(timezone.utc) - timedelta(hours=deadline_hours)
        cancelled_ids = []

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Booking)
                .options(selectinload(Booking.payments))
                .where(
                    and_(
                        Booking.status == BookingStatus.pending,
                        Booking.created_at <= cutoff,
                    )
                )
            )
            bookings = result.scalars().all()

            for booking in bookings:
                # Verificar que no haya ningún pago aprobado o en proceso
                has_paid = any(
                    p.status in (PaymentStatus.approved, PaymentStatus.in_process)
                    for p in booking.payments
                )
                if not has_paid:
                    booking.status = BookingStatus.cancelled
                    cancelled_ids.append(booking.id)
                    logger.info(f"[CANCEL] Reserva {booking.id} cancelada por falta de pago (>{deadline_hours}h)")

            await db.commit()

        return {"cancelled": len(cancelled_ids), "ids": cancelled_ids}

    try:
        return asyncio.run(_run())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=120)


@shared_task(name="app.tasks.bookings.reconcile_pending_payments")
def reconcile_pending_payments():
    """
    Verifica pagos en estado 'in_process' contra la API de Mercado Pago
    y actualiza su estado si ya fueron aprobados o rechazados.
    """
    import asyncio
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from ..database import AsyncSessionLocal
    from ..models.booking import Booking, BookingStatus
    from ..models.payment import Payment, PaymentStatus
    from ..services.mercadopago_service import get_payment_info
    from ..services.email import notify_booking_confirmed
    from datetime import datetime, timezone

    async def _run():
        updated = 0

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Payment)
                .options(selectinload(Payment.booking))
                .where(Payment.status == PaymentStatus.in_process)
            )
            payments = result.scalars().all()

            for payment in payments:
                if not payment.mp_payment_id:
                    continue
                try:
                    info = get_payment_info(payment.mp_payment_id)
                    status = info.get("status")

                    if status == "approved":
                        payment.status = PaymentStatus.approved
                        payment.paid_at = datetime.now(timezone.utc)
                        if payment.booking and payment.booking.status != BookingStatus.confirmed:
                            payment.booking.status = BookingStatus.confirmed
                            # Email de confirmación
                            b = payment.booking
                            booking_dict = {
                                "guest_name": b.guest_name, "guest_email": b.guest_email,
                                "guest_phone": b.guest_phone or "", "accommodation_name": b.accommodation_name,
                                "check_in": b.check_in, "check_out": b.check_out,
                                "number_of_guests": b.number_of_guests, "total_price": b.total_price,
                                "deposit_amount": b.deposit_amount, "balance_amount": b.balance_amount,
                                "special_requests": b.special_requests,
                            }
                            await notify_booking_confirmed(booking_dict)
                        updated += 1
                    elif status in ("rejected", "cancelled"):
                        payment.status = PaymentStatus.rejected
                        updated += 1
                except Exception as e:
                    logger.error(f"[RECONCILE] Error verificando pago {payment.mp_payment_id}: {e}")

            await db.commit()

        logger.info(f"reconcile_pending_payments: {updated} pagos actualizados")
        return {"updated": updated}

    return asyncio.run(_run())
