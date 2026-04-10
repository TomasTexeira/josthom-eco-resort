from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ─── App ──────────────────────────────────────────────
    APP_NAME: str = "Josthom Eco Resort API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ─── Base de datos ────────────────────────────────────
    DATABASE_URL: str

    # ─── Redis ────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ─── Seguridad / JWT ──────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ─── Mercado Pago ─────────────────────────────────────
    MP_ACCESS_TOKEN: str = ""
    MP_PUBLIC_KEY: str = ""
    MP_WEBHOOK_SECRET: str = ""
    MP_SANDBOX: bool = True   # cambiar a False con cuenta real de producción

    # ─── Email ────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "reservas@josthom.com.ar"

    # ─── WhatsApp Business ────────────────────────────────
    WHATSAPP_TOKEN: str = ""
    WHATSAPP_PHONE_ID: str = ""
    WHATSAPP_VERIFY_TOKEN: str = ""

    # ─── Admin ────────────────────────────────────────────
    ADMIN_EMAIL: str = ""
    ADMIN_WHATSAPP: str = "5491138323695"

    # ─── URLs ─────────────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:3000"
    # URL pública de la API para que MP pueda llamar al webhook
    # En producción: https://api.josthom.com.ar  o tu dominio del NAS
    API_PUBLIC_URL: str = "http://localhost:8000"

    # ─── Negocio ──────────────────────────────────────────
    PRICE_1_2_GUESTS: int = 180000
    PRICE_3_GUESTS: int = 240000
    PRICE_4_GUESTS: int = 300000
    PRICE_5_GUESTS: int = 360000
    WEEKDAY_DISCOUNT_PCT: float = 0.15
    DEPOSIT_PCT: float = 0.25
    MIN_NIGHTS: int = 2
    BOOKING_PAYMENT_DEADLINE_HOURS: int = 24  # horas para pagar antes de auto-cancelar


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
