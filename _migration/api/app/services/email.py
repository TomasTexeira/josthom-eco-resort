"""
Servicio de email — notificaciones automáticas de reservas.
Usa aiosmtplib (async SMTP). Configurar SMTP_* en el .env.
"""
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from ..core.config import settings

logger = logging.getLogger(__name__)


# ─── Templates HTML ────────────────────────────────────────────────────────────

def _base_template(content: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
               background: #f9fafb; margin: 0; padding: 0; }}
        .container {{ max-width: 560px; margin: 32px auto; background: white;
                     border-radius: 12px; overflow: hidden;
                     box-shadow: 0 1px 3px rgba(0,0,0,.1); }}
        .header {{ background: #14532d; padding: 28px 32px; text-align: center; }}
        .header h1 {{ color: white; margin: 0; font-size: 22px; font-weight: 700; }}
        .header p  {{ color: #86efac; margin: 6px 0 0; font-size: 13px; }}
        .body {{ padding: 28px 32px; }}
        .body p {{ color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }}
        .card {{ background: #f0fdf4; border: 1px solid #bbf7d0;
                border-radius: 8px; padding: 16px 20px; margin: 20px 0; }}
        .card-row {{ display: flex; justify-content: space-between;
                    font-size: 14px; color: #374151; padding: 4px 0; }}
        .card-row strong {{ color: #111827; }}
        .divider {{ border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }}
        .total-row {{ display: flex; justify-content: space-between;
                     font-size: 16px; font-weight: 700; color: #111827;
                     padding: 8px 0; }}
        .deposit {{ color: #15803d; font-size: 14px;
                   display: flex; justify-content: space-between; }}
        .btn {{ display: block; background: #15803d; color: white !important;
               text-decoration: none; text-align: center; padding: 14px 24px;
               border-radius: 8px; font-weight: 600; font-size: 15px;
               margin: 24px 0 0; }}
        .footer {{ background: #f9fafb; padding: 20px 32px; text-align: center;
                  color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6; }}
        .badge {{ display: inline-block; background: #fef3c7; color: #92400e;
                 padding: 3px 10px; border-radius: 99px; font-size: 12px;
                 font-weight: 600; margin-bottom: 12px; }}
        .confirmed {{ background: #dcfce7; color: #15803d; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌿 Josthom Eco Resort</h1>
          <p>Villa Paranacito, Entre Ríos · Delta del Paraná</p>
        </div>
        <div class="body">{content}</div>
        <div class="footer">
          Josthom Eco Resort · Villa Paranacito, Entre Ríos, Argentina<br/>
          <a href="https://wa.me/5491138323695" style="color:#15803d">WhatsApp</a> ·
          reservas@josthom.com.ar
        </div>
      </div>
    </body>
    </html>
    """


def _booking_card(b: dict) -> str:
    return f"""
    <div class="card">
      <div class="card-row"><span>🏡 Cabaña</span><strong>{b['accommodation_name']}</strong></div>
      <div class="card-row"><span>📅 Check-in</span><strong>{b['check_in']}</strong></div>
      <div class="card-row"><span>📅 Check-out</span><strong>{b['check_out']}</strong></div>
      <div class="card-row"><span>👥 Huéspedes</span><strong>{b['number_of_guests']}</strong></div>
      <hr class="divider"/>
      <div class="total-row"><span>Total</span><span>${b['total_price']:,.0f}</span></div>
      <div class="deposit"><span>Seña (25%)</span><span>${b['deposit_amount']:,.0f}</span></div>
      <div class="deposit" style="color:#6b7280"><span>Saldo al checkout</span><span>${b['balance_amount']:,.0f}</span></div>
    </div>
    """


# ─── Templates de cada email ───────────────────────────────────────────────────

def tpl_guest_pending(b: dict, payment_url: str) -> tuple[str, str]:
    """Email al huésped: reserva pendiente de pago."""
    subject = f"Reserva recibida — {b['accommodation_name']} · Josthom"
    body = _base_template(f"""
      <p>¡Hola <strong>{b['guest_name'].split()[0]}</strong>! 👋</p>
      <p>Recibimos tu solicitud de reserva. Para confirmarla, completá el pago de la seña
         (25% del total) haciendo clic en el botón de abajo.</p>
      {_booking_card(b)}
      <p style="font-size:13px;color:#6b7280;">
        Una vez acreditado el pago recibirás otro email con la confirmación definitiva.
        El saldo restante (${b['balance_amount']:,.0f}) se abona en efectivo o transferencia
        al momento del check-out.
      </p>
      <a href="{payment_url}" class="btn">💳 Pagar seña — ${b['deposit_amount']:,.0f}</a>
      <p style="font-size:12px;color:#9ca3af;margin-top:12px;text-align:center;">
        ¿Tenés alguna consulta?
        <a href="https://wa.me/5491138323695" style="color:#15803d">Escribinos por WhatsApp</a>
      </p>
    """)
    return subject, body


def tpl_guest_confirmed(b: dict) -> tuple[str, str]:
    """Email al huésped: reserva confirmada tras pago."""
    subject = f"✅ Reserva confirmada — {b['accommodation_name']} · Josthom"
    body = _base_template(f"""
      <div style="text-align:center;margin-bottom:8px;">
        <span class="badge confirmed">✓ Reserva confirmada</span>
      </div>
      <p>¡Hola <strong>{b['guest_name'].split()[0]}</strong>! Tu reserva está confirmada 🎉</p>
      <p>Recibimos el pago de la seña. ¡Te esperamos!</p>
      {_booking_card(b)}
      <p style="font-size:13px;color:#374151;">
        <strong>Horarios:</strong> Check-in desde las 15:00 hs · Check-out hasta las 11:00 hs
      </p>
      <p style="font-size:13px;color:#374151;">
        El saldo restante (<strong>${b['balance_amount']:,.0f}</strong>) se abona en efectivo
        o transferencia al retirarse.
      </p>
      <a href="https://wa.me/5491138323695?text=Hola!+Tengo+reserva+confirmada+para+{b['check_in']}"
         class="btn">📍 Ver cómo llegar por WhatsApp</a>
    """)
    return subject, body


def tpl_admin_new_booking(b: dict, payment_url: str) -> tuple[str, str]:
    """Email al admin: nueva reserva ingresada."""
    subject = f"🔔 Nueva reserva — {b['guest_name']} · {b['accommodation_name']}"
    body = _base_template(f"""
      <p><strong>Nueva reserva recibida.</strong></p>
      <p>El huésped recibió el link de pago. La reserva quedará confirmada cuando se acredite la seña.</p>
      {_booking_card(b)}
      <div class="card" style="background:#fefce8;border-color:#fde68a;">
        <div class="card-row"><span>👤 Huésped</span><strong>{b['guest_name']}</strong></div>
        <div class="card-row"><span>📧 Email</span><strong>{b['guest_email']}</strong></div>
        <div class="card-row"><span>📱 WhatsApp</span>
          <strong><a href="https://wa.me/{b['guest_phone'].replace('+','').replace(' ','')}"
            style="color:#15803d">{b['guest_phone']}</a></strong>
        </div>
        {'<div class="card-row"><span>📝 Pedidos especiales</span></div><div style="font-size:13px;color:#374151;margin-top:4px;">' + b.get('special_requests','') + '</div>' if b.get('special_requests') else ''}
      </div>
      <a href="{settings.FRONTEND_URL}/admin" class="btn">Ver en el panel admin</a>
    """)
    return subject, body


def tpl_admin_booking_confirmed(b: dict) -> tuple[str, str]:
    """Email al admin: seña cobrada, reserva confirmada."""
    subject = f"💰 Seña cobrada — {b['guest_name']} · {b['accommodation_name']}"
    body = _base_template(f"""
      <div style="text-align:center;margin-bottom:8px;">
        <span class="badge confirmed">✓ Pago acreditado</span>
      </div>
      <p>Se acreditó el pago de la seña. La reserva está <strong>confirmada</strong>.</p>
      {_booking_card(b)}
      <div class="card" style="background:#fefce8;border-color:#fde68a;">
        <div class="card-row"><span>👤 Huésped</span><strong>{b['guest_name']}</strong></div>
        <div class="card-row"><span>📱 WhatsApp</span>
          <strong><a href="https://wa.me/{b['guest_phone'].replace('+','').replace(' ','')}"
            style="color:#15803d">{b['guest_phone']}</a></strong>
        </div>
      </div>
      <a href="{settings.FRONTEND_URL}/admin" class="btn">Ver en el panel admin</a>
    """)
    return subject, body


# ─── Envío ─────────────────────────────────────────────────────────────────────

async def _send(to: str, subject: str, html: str) -> None:
    """Envía un email por SMTP async."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(f"[EMAIL] Sin credenciales SMTP — email a {to} no enviado. Asunto: {subject}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"Josthom Eco Resort <{settings.EMAIL_FROM}>"
    msg["To"]      = to
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info(f"[EMAIL] ✓ Enviado a {to} — {subject}")
    except Exception as e:
        logger.error(f"[EMAIL] ✗ Error enviando a {to}: {e}")
        # No levantar excepción — el email es secundario, la reserva ya se creó


async def notify_booking_created(booking: dict, payment_url: str) -> None:
    """Dispara emails cuando se crea una reserva (antes del pago)."""
    # Al huésped
    subj, html = tpl_guest_pending(booking, payment_url)
    await _send(booking["guest_email"], subj, html)

    # Al admin
    if settings.ADMIN_EMAIL:
        subj, html = tpl_admin_new_booking(booking, payment_url)
        await _send(settings.ADMIN_EMAIL, subj, html)


async def notify_booking_confirmed(booking: dict) -> None:
    """Dispara emails cuando se confirma el pago."""
    # Al huésped
    subj, html = tpl_guest_confirmed(booking)
    await _send(booking["guest_email"], subj, html)

    # Al admin
    if settings.ADMIN_EMAIL:
        subj, html = tpl_admin_booking_confirmed(booking)
        await _send(settings.ADMIN_EMAIL, subj, html)


async def send_checkin_reminder(booking: dict) -> None:
    """Recordatorio 48hs antes del check-in."""
    subject = f"📅 Tu estadía en Josthom es en 2 días — {booking['accommodation_name']}"
    body = _base_template(f"""
      <p>Hola <strong>{booking['guest_name']}</strong>,</p>
      <p>Te recordamos que tu estadía en <strong>{booking['accommodation_name']}</strong>
         comienza en <strong>2 días</strong>. ¡Ya casi es hora!</p>
      {_booking_card(booking)}
      <p style="color:#78350f;font-size:13px;">
        Check-in a partir de las 14:00 hs. Si tenés alguna consulta, respondé este email
        o escribinos por WhatsApp.
      </p>
    """)
    await _send(booking["guest_email"], subject, body)
