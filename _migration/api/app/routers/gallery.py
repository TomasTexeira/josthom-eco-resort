from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models.gallery import GalleryImage
from .deps import require_admin

router = APIRouter(prefix="/api/gallery", tags=["gallery"])

VALID_CATEGORIES = {"campo", "animales", "gastronomía", "paisaje", "instalaciones"}


class GalleryImageIn(BaseModel):
    image_url: str
    title: Optional[str] = None
    category: str = "campo"
    order: int = 0


class GalleryImageOut(GalleryImageIn):
    id: str
    model_config = {"from_attributes": True}


@router.get("", response_model=list[GalleryImageOut])
async def list_images(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(GalleryImage).order_by(GalleryImage.order, GalleryImage.id)
    if category and category != "all":
        query = query.where(GalleryImage.category == category)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=GalleryImageOut, dependencies=[Depends(require_admin)])
async def create_image(data: GalleryImageIn, db: AsyncSession = Depends(get_db)):
    img = GalleryImage(**data.model_dump())
    db.add(img)
    await db.flush()
    return img


@router.put("/{image_id}", response_model=GalleryImageOut, dependencies=[Depends(require_admin)])
async def update_image(image_id: str, data: GalleryImageIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GalleryImage).where(GalleryImage.id == image_id))
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    for field, value in data.model_dump().items():
        setattr(img, field, value)
    return img


@router.delete("/{image_id}", dependencies=[Depends(require_admin)])
async def delete_image(image_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GalleryImage).where(GalleryImage.id == image_id))
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    await db.delete(img)
    return {"ok": True}
