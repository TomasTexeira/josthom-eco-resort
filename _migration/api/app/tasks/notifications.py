"""
Tareas de notificaciones programadas (Celery).
- send_checkin_reminders: recordatorio 48hs antes del check-in
"""
import logging
from datetime import datetime, timedelta, timezone

from celery import shared_task
from sqlalchemy import select

from ..database import AsyncSessionLocal
from ..models.booking import Booking, BookingStatus
from ..services.email import send_checkin_reminder

logger = logging.getLogger(__name__)


@shared_task(name="app.tasks.notifications.send_checkin_reminders")
def send_checkin_reminders():
    """Envía recordatorio de check-in a reservas confirmadas con check-in en 48hs."""
    import asyncio
    asyncio.run(_send_checkin_reminders())


async def _send_checkin_reminders():
    now = datetime.now(timezone.utc).date()
    target_date = now + timedelta(days=2)

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Booking).where(
                Booking.status == BookingStatus.confirmed,
                Booking.check_in == target_date,
            )
        )
        bookings = result.scalars().all()

        logger.info(f"[REMINDERS] {len(bookings)} reservas con check-in en 48hs")

        for booking in bookings:
            try:
                await send_checkin_reminder({
                    "guest_name":         booking.guest_name,
                    "guest_email":        booking.guest_email,
                    "accommodation_name": booking.accommodation_name,
                    "check_in":           booking.check_in,
                    "check_out":          booking.check_out,
                    "number_of_guests":   booking.number_of_guests,
                })
                logger.info(f"[REMINDERS] Recordatorio enviado a {booking.guest_email}")
            except Exception as e:
                logger.error(f"[REMINDERS] Error enviando recordatorio a {booking.guest_email}: {e}")
