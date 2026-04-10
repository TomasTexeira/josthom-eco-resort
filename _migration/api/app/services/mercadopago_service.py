"""
Servicio de Mercado Pago — Checkout Pro para seña de reservas.

En desarrollo/sin credenciales: devuelve una URL de sandbox simulada.
En producción: descomentar las líneas reales del SDK.

Para activar:
  1. Creá tu cuenta en mercadopago.com.ar/developers
  2. Copiá Access Token y Public Key al .env.local
  3. Las líneas de SDK se activan automáticamente cuando MP_ACCESS_TOKEN != ""
"""
import mercadopago
from ..core.config import settings


def _get_sdk() -> mercadopago.SDK | None:
    """Devuelve el SDK de MP solo si hay credenciales configuradas."""
    if not settings.MP_ACCESS_TOKEN:
        return None
    return mercadopago.SDK(settings.MP_ACCESS_TOKEN)


def create_deposit_preference(
    booking_id: str,
    accommodation_name: str,
    check_in: str,
    check_out: str,
    guest_name: str,
    guest_email: str,
    amount: float,
) -> dict:
    """
    Crea una preferencia de pago en MP para la seña (25%).
    Retorna: { payment_url, preference_id }
    """
    sdk = _get_sdk()

    if sdk is None:
        # Sin credenciales: modo desarrollo — URL simulada para testear el flujo
        fake_pref_id = f"SANDBOX_{booking_id[:8]}"
        return {
            "payment_url": (
                f"{settings.FRONTEND_URL}/reserva/pendiente"
                f"?booking_id={booking_id}&sandbox=1"
            ),
            "preference_id": fake_pref_id,
        }

    preference_data = {
        "items": [{
            "id": booking_id,
            "title": f"Seña — {accommodation_name}",
            "description": f"Check-in {check_in} · Check-out {check_out}",
            "quantity": 1,
            "unit_price": float(amount),
            "currency_id": "ARS",
        }],
        "payer": {
            "name": guest_name,
            "email": guest_email,
        },
        "back_urls": {
            "success": f"{settings.FRONTEND_URL}/reserva/confirmada?booking_id={booking_id}",
            "failure": f"{settings.FRONTEND_URL}/reserva/error?booking_id={booking_id}",
            "pending": f"{settings.FRONTEND_URL}/reserva/pendiente?booking_id={booking_id}",
        },
        "auto_return": "approved",
        "external_reference": booking_id,
        "notification_url": f"{settings.API_PUBLIC_URL}/api/payments/webhook/mercadopago",
        "statement_descriptor": "JOSTHOM ECO RESORT",
        "expires": False,
        # MP retiene el pago hasta que se entregue el servicio (turismo)
        "binary_mode": False,
    }

    response = sdk.preference().create(preference_data)
    preference = response["response"]

    if response["status"] not in (200, 201):
        raise RuntimeError(f"Error MP: {preference}")

    # En producción usar init_point; en sandbox usar sandbox_init_point
    url_key = "sandbox_init_point" if settings.MP_SANDBOX else "init_point"
    return {
        "payment_url": preference[url_key],
        "preference_id": preference["id"],
    }


def get_payment_info(mp_payment_id: str) -> dict:
    """Consulta el estado de un pago en MP."""
    sdk = _get_sdk()
    if sdk is None:
        return {"status": "sandbox", "status_detail": "development_mode"}

    response = sdk.payment().get(mp_payment_id)
    return response["response"]
