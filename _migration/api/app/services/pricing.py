"""
Lógica de precios - migrada directamente desde AvailabilityCalendar.jsx y BookingsManager.jsx
"""
from datetime import date, timedelta
from ..core.config import settings


def get_base_price(guests: int) -> float:
    """Precio base por noche según cantidad de huéspedes."""
    if guests <= 2:
        return settings.PRICE_1_2_GUESTS
    elif guests == 3:
        return settings.PRICE_3_GUESTS
    elif guests == 4:
        return settings.PRICE_4_GUESTS
    else:  # 5+
        return settings.PRICE_5_GUESTS


def is_weekday(d: date) -> bool:
    """Lunes (0) a jueves (3) = weekday con descuento."""
    return d.weekday() < 4


def calculate_price(check_in: date, check_out: date, guests: int) -> dict:
    """
    Calcula el precio total con descuentos por días de semana.

    Returns:
        {
            nights: int,
            base_price_per_night: float,
            breakdown: [{date, price, discount_applied}],
            weekday_discount_amount: float,
            total_price: float,
            deposit_amount: float,
            balance_amount: float,
        }
    """
    base_price = get_base_price(guests)
    nights = (check_out - check_in).days

    breakdown = []
    total = 0.0
    discount_total = 0.0

    current = check_in
    for _ in range(nights):
        if is_weekday(current):
            discount = base_price * settings.WEEKDAY_DISCOUNT_PCT
            night_price = base_price - discount
            discount_total += discount
        else:
            night_price = base_price

        breakdown.append({
            "date": current.isoformat(),
            "day_of_week": current.strftime("%A"),
            "price": night_price,
            "discount_applied": is_weekday(current),
        })
        total += night_price
        current += timedelta(days=1)

    deposit = round(total * settings.DEPOSIT_PCT)
    balance = round(total - deposit)

    return {
        "nights": nights,
        "base_price_per_night": base_price,
        "breakdown": breakdown,
        "weekday_discount_amount": round(discount_total),
        "total_price": round(total),
        "deposit_amount": deposit,
        "balance_amount": balance,
    }
