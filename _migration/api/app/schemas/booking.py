from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from ..models.booking import BookingStatus, BookingSource


class BookingCreate(BaseModel):
    accommodation_id: str
    accommodation_name: str
    guest_name: str
    guest_email: EmailStr
    guest_phone: Optional[str] = None
    number_of_guests: int = 2
    check_in: str   # "YYYY-MM-DD"
    check_out: str  # "YYYY-MM-DD"
    special_requests: Optional[str] = None
    source: BookingSource = BookingSource.web


class BookingUpdate(BaseModel):
    guest_name: Optional[str] = None
    guest_email: Optional[EmailStr] = None
    guest_phone: Optional[str] = None
    number_of_guests: Optional[int] = None
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    status: Optional[BookingStatus] = None
    special_requests: Optional[str] = None


class PaymentSummary(BaseModel):
    id: str
    type: str
    amount: float
    status: str
    mp_payment_id: Optional[str] = None
    paid_at: Optional[datetime] = None
    payment_url: Optional[str] = None

    model_config = {"from_attributes": True}


class BookingOut(BaseModel):
    id: str
    accommodation_id: str
    accommodation_name: str
    guest_name: str
    guest_email: str
    guest_phone: Optional[str] = None
    number_of_guests: int
    check_in: str
    check_out: str
    total_price: float
    deposit_amount: float
    balance_amount: float
    status: BookingStatus
    source: BookingSource
    special_requests: Optional[str] = None
    created_at: datetime
    payments: list[PaymentSummary] = []

    model_config = {"from_attributes": True}


class AvailabilityCheck(BaseModel):
    accommodation_id: str
    check_in: str
    check_out: str


class PriceCalculation(BaseModel):
    accommodation_id: str
    check_in: str
    check_out: str
    number_of_guests: int


class PriceResponse(BaseModel):
    nights: int
    base_price_per_night: float
    weekday_discount_amount: float
    total_price: float
    deposit_amount: float
    balance_amount: float
    breakdown: list[dict]
