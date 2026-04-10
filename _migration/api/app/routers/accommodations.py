from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models.accommodation import Accommodation
from ..schemas.accommodation import AccommodationCreate, AccommodationUpdate, AccommodationOut
from .deps import require_admin

router = APIRouter(prefix="/api/accommodations", tags=["accommodations"])


@router.get("", response_model=list[AccommodationOut])
async def list_accommodations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Accommodation).order_by(Accommodation.order, Accommodation.name)
    )
    return result.scalars().all()


@router.get("/featured", response_model=list[AccommodationOut])
async def list_featured(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Accommodation)
        .where(Accommodation.is_featured == True)
        .order_by(Accommodation.order)
        .limit(6)
    )
    return result.scalars().all()


@router.get("/{accommodation_id}", response_model=AccommodationOut)
async def get_accommodation(accommodation_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Accommodation).where(Accommodation.id == accommodation_id)
    )
    acc = result.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=404, detail="Alojamiento no encontrado")
    return acc


@router.post("", response_model=AccommodationOut, dependencies=[Depends(require_admin)])
async def create_accommodation(data: AccommodationCreate, db: AsyncSession = Depends(get_db)):
    acc = Accommodation(**data.model_dump())
    db.add(acc)
    await db.flush()
    return acc


@router.put("/{accommodation_id}", response_model=AccommodationOut, dependencies=[Depends(require_admin)])
async def update_accommodation(
    accommodation_id: str,
    data: AccommodationUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Accommodation).where(Accommodation.id == accommodation_id)
    )
    acc = result.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=404, detail="Alojamiento no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(acc, field, value)
    return acc


@router.delete("/{accommodation_id}", dependencies=[Depends(require_admin)])
async def delete_accommodation(accommodation_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Accommodation).where(Accommodation.id == accommodation_id)
    )
    acc = result.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=404, detail="Alojamiento no encontrado")
    await db.delete(acc)
    return {"ok": True}
