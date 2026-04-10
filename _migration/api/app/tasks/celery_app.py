from celery import Celery
from celery.schedules import crontab
from ..core.config import settings

celery_app = Celery(
    "josthom",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.bookings", "app.tasks.notifications"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Argentina/Buenos_Aires",
    enable_utc=True,
    task_track_started=True,
)

# ─── Tareas programadas ──────────────────────────────────
# Reemplazan las funciones serverless de Base44 (Deno)
celery_app.conf.beat_schedule = {
    # autoCompleteBookings: diariamente a medianoche
    "auto-complete-bookings": {
        "task": "app.tasks.bookings.auto_complete_bookings",
        "schedule": crontab(hour=0, minute=0),
    },
    # autoCancelExpiredBookings: diariamente a las 6am
    "auto-cancel-expired-bookings": {
        "task": "app.tasks.bookings.auto_cancel_expired_bookings",
        "schedule": crontab(hour=6, minute=0),
    },
    # Recordatorio pre check-in (48hs): diariamente a las 10am
    "checkin-reminders": {
        "task": "app.tasks.notifications.send_checkin_reminders",
        "schedule": crontab(hour=10, minute=0),
    },
    # Cancelar reservas sin pago tras el plazo (24h): cada hora
    "cancel-unpaid-bookings": {
        "task": "app.tasks.bookings.cancel_unpaid_bookings",
        "schedule": crontab(minute=0),   # cada hora en punto
    },
    # Verificar pagos en proceso en MP: cada hora
    "reconcile-payments": {
        "task": "app.tasks.bookings.reconcile_pending_payments",
        "schedule": crontab(minute=30),  # cada hora a los 30 minutos
    },
}
