from sqlalchemy import String, Integer, Float, Date, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from ..database import Base
from datetime import datetime
import uuid
import enum


class BookingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"


class BookingSource(str, enum.Enum):
    web = "web"
    airbnb = "airbnb"
    booking = "booking"
    phone = "phone"
    whatsapp = "whatsapp"


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    accommodation_id: Mapped[str] = mapped_column(String(36), ForeignKey("accommodations.id"), nullable=False)
    accommodation_name: Mapped[str] = mapped_column(String(200), nullable=False)

    # Datos del huésped
    guest_name: Mapped[str] = mapped_column(String(200), nullable=False)
    guest_email: Mapped[str] = mapped_column(String(300), nullable=False)
    guest_phone: Mapped[str] = mapped_column(String(50))
    number_of_guests: Mapped[int] = mapped_column(Integer, default=2)

    # Fechas
    check_in: Mapped[str] = mapped_column(String(30), nullable=False)   # ISO date string
    check_out: Mapped[str] = mapped_column(String(30), nullable=False)

    # Precios
    total_price: Mapped[float] = mapped_column(Float, default=0)
    deposit_amount: Mapped[float] = mapped_column(Float, default=0)    # 25%
    balance_amount: Mapped[float] = mapped_column(Float, default=0)    # 75%

    # Estado
    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus), default=BookingStatus.pending
    )

    # Origen
    source: Mapped[BookingSource] = mapped_column(
        Enum(BookingSource), default=BookingSource.web
    )

    # Notas
    special_requests: Mapped[str | None] = mapped_column(Text)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relaciones — usar siempre selectinload() explícito en las queries, nunca lazy
    accommodation: Mapped["Accommodation"] = relationship(
        "Accommodation", back_populates="bookings"
    )
    payments: Mapped[list["Payment"]] = relationship(
        "Payment", back_populates="booking", cascade="all, delete-orphan"
    )
