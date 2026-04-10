from pydantic import BaseModel, HttpUrl
from typing import Optional


class AccommodationBase(BaseModel):
    name: str
    type: str = "cabaña"
    capacity: int = 2
    bedrooms: int = 1
    bathrooms: int = 1
    description: Optional[str] = None
    short_description: Optional[str] = None
    main_image: Optional[str] = None
    gallery_images: list[str] = []
    amenities: list[str] = []
    booking_url: Optional[str] = None
    price_per_night: Optional[float] = None
    is_featured: bool = False
    order: int = 0


class AccommodationCreate(AccommodationBase):
    pass


class AccommodationUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    capacity: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    main_image: Optional[str] = None
    gallery_images: Optional[list[str]] = None
    amenities: Optional[list[str]] = None
    booking_url: Optional[str] = None
    price_per_night: Optional[float] = None
    is_featured: Optional[bool] = None
    order: Optional[int] = None


class AccommodationOut(AccommodationBase):
    id: str

    model_config = {"from_attributes": True}
