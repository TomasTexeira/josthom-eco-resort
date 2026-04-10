from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from ..database import Base
import uuid


class SiteContent(Base):
    __tablename__ = "site_content"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    section: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    # hero | about | experience | location | contact | gallery
    title: Mapped[str | None] = mapped_column(String(500))
    subtitle: Mapped[str | None] = mapped_column(String(500))
    content: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(1000))
