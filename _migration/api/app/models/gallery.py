from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from ..database import Base
import uuid


class GalleryImage(Base):
    __tablename__ = "gallery_images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    image_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    title: Mapped[str | None] = mapped_column(String(300))
    category: Mapped[str] = mapped_column(String(50), default="campo")
    # campo | animales | gastronomía | paisaje | instalaciones
    order: Mapped[int] = mapped_column(Integer, default=0)
