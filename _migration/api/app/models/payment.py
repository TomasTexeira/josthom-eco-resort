from sqlalchemy import String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from ..database import Base
from datetime import datetime
import uuid
import enum


class PaymentType(str, enum.Enum):
    deposit = "deposit"   # 25%
    balance = "balance"   # 75%
    full = "full"         # pago total


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    in_process = "in_process"
    refunded = "refunded"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id"), nullable=False)

    type: Mapped[PaymentType] = mapped_column(Enum(PaymentType), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.pending)

    # Datos de Mercado Pago
    mp_preference_id: Mapped[str | None] = mapped_column(String(200))
    mp_payment_id: Mapped[str | None] = mapped_column(String(200))
    mp_external_reference: Mapped[str | None] = mapped_column(String(200))
    mp_payment_method: Mapped[str | None] = mapped_column(String(100))
    mp_status_detail: Mapped[str | None] = mapped_column(String(200))

    # Link de pago para enviar al huésped
    payment_url: Mapped[str | None] = mapped_column(Text)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relación
    booking: Mapped["Booking"] = relationship("Booking", back_populates="payments")
