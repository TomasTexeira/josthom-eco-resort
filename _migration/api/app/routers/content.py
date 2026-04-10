from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models.content import SiteContent
from .deps import require_admin

router = APIRouter(prefix="/api/content", tags=["content"])

VALID_SECTIONS = {"hero", "about", "experience", "location", "contact", "gallery"}


class SiteContentIn(BaseModel):
    section: str
    title: Optional[str] = None
    subtitle: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None


class SiteContentOut(SiteContentIn):
    id: str
    model_config = {"from_attributes": True}


@router.get("", response_model=list[SiteContentOut])
async def list_content(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SiteContent).order_by(SiteContent.section))
    return result.scalars().all()


@router.get("/{section}", response_model=SiteContentOut)
async def get_section(section: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SiteContent).where(SiteContent.section == section))
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail=f"Sección '{section}' no encontrada")
    return content


@router.put("/{section}", response_model=SiteContentOut, dependencies=[Depends(require_admin)])
async def upsert_section(section: str, data: SiteContentIn, db: AsyncSession = Depends(get_db)):
    """Crea o actualiza una sección de contenido."""
    result = await db.execute(select(SiteContent).where(SiteContent.section == section))
    content = result.scalar_one_or_none()

    if content:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(content, field, value)
    else:
        content = SiteContent(**data.model_dump(), section=section)
        db.add(content)

    await db.flush()
    return content
