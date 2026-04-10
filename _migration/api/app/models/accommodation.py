from sqlalchemy import String, Integer, Boolean, Text, Float
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base
import uuid


class Accommodation(Base):
    __tablename__ = "accommodations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="cabaña")  # cabaña | casa
    capacity: Mapped[int] = mapped_column(Integer, default=2)
    bedrooms: Mapped[int] = mapped_column(Integer, default=1)
    bathrooms: Mapped[int] = mapped_column(Integer, default=1)
    description: Mapped[str | None] = mapped_column(Text)
    short_description: Mapped[str | None] = mapped_column(String(500))
    main_image: Mapped[str | None] = mapped_column(String(1000))
    gallery_images: Mapped[list] = mapped_column(ARRAY(Text), default=list)
    amenities: Mapped[list] = mapped_column(ARRAY(Text), default=list)
    booking_url: Mapped[str | None] = mapped_column(String(1000))
    price_per_night: Mapped[float | None] = mapped_column(Float)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)

    # Relación — usar selectinload() explícito en las queries cuando se necesite
    bookings: Mapped[list["Booking"]] = relationship(
        "Booking", back_populates="accommodation"
    )
