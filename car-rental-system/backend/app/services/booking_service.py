"""Booking service: create, list, get, cancel; pricing + ID generation."""
from __future__ import annotations

import random
import string
from datetime import date
from typing import Optional

from app.core.db import fetch_one, fetch_all, execute
from app.models.booking import BookingCreate, BookingOut
from app.services.car_service import get_car


# ---------- Pricing (pure functions, per spec) ----------

def days_between(pickup: str, return_: str) -> int:
    """Returns number of days (inclusive of pickup day, exclusive of return day,
    so a 1-day rental = 1)."""
    p = date.fromisoformat(pickup)
    r = date.fromisoformat(return_)
    delta = (r - p).days
    if delta < 1:
        raise ValueError("Return date must be after pickup date")
    return delta


def compute_total_cost(days: int, price_per_day: int) -> int:
    return days * price_per_day


def generate_booking_id() -> str:
    """BK-YYYY-XXXX where XXXX is 4-char uppercase alphanumeric."""
    year = date.today().year
    alphabet = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(alphabet, k=4))
    return f"BK-{year}-{suffix}"


# ---------- Row -> model ----------

def _row_to_booking(row: dict) -> BookingOut:
    return BookingOut(
        id=row["id"],
        user_id=row["user_id"],
        car_id=row["car_id"],
        car_name=row["car_name"],
        customer_name=row["customer_name"],
        email=row["email"],
        phone=row["phone"],
        pickup_date=row["pickup_date"],
        return_date=row["return_date"],
        pickup_address=row["pickup_address"],
        special_requests=row["special_requests"],
        total_days=row["total_days"],
        total_cost=row["total_cost"],
        status=row["status"],
        created_at=row["created_at"],
    )


# ---------- Public API ----------

async def create_booking(user_id: str, payload: BookingCreate) -> dict:
    """Create a booking for the given user.

    Returns a dict:
      {
        "booking": BookingOut,
        "warning": Optional[str]   # present if car unavailable
      }

    Raises:
      ValueError: car_id not found, or invalid date math (should be caught
      by Pydantic but double-checked here).
    """
    car = await get_car(payload.car_id)
    if not car:
        raise ValueError(f"Car with id '{payload.car_id}' not found")

    total_days = days_between(payload.pickup_date, payload.return_date)
    total_cost = compute_total_cost(total_days, car.price_per_day)

    # Generate a unique booking ID (extremely low collision risk for MVP volume).
    booking_id = generate_booking_id()
    # Defensive check — retry on the tiny chance of a collision.
    for _ in range(3):
        existing = await fetch_one("SELECT id FROM bookings WHERE id = ?", (booking_id,))
        if not existing:
            break
        booking_id = generate_booking_id()

    await execute(
        """
        INSERT INTO bookings (
          id, user_id, car_id, car_name, customer_name, email, phone,
          pickup_date, return_date, pickup_address, special_requests,
          total_days, total_cost, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        """,
        (
            booking_id, user_id, car.id, car.name, payload.customer_name,
            payload.email, payload.phone, payload.pickup_date, payload.return_date,
            payload.pickup_address, payload.special_requests,
            total_days, total_cost,
        ),
    )

    row = await fetch_one("SELECT * FROM bookings WHERE id = ?", (booking_id,))
    booking = _row_to_booking(row)  # type: ignore[arg-type]

    warning: Optional[str] = None
    if not car.is_available:
        warning = (
            f"Note: '{car.name}' is currently marked unavailable in our fleet. "
            "Your booking has been recorded as pending and our team will confirm availability."
        )

    return {"booking": booking, "warning": warning}


async def list_bookings_for_user(user_id: str) -> list[BookingOut]:
    rows = await fetch_all(
        "SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    )
    return [_row_to_booking(r) for r in rows]


async def get_booking_for_user(user_id: str, booking_id: str) -> Optional[BookingOut]:
    row = await fetch_one(
        "SELECT * FROM bookings WHERE id = ? AND user_id = ?",
        (booking_id, user_id),
    )
    if not row:
        return None
    return _row_to_booking(row)


async def cancel_booking(user_id: str, booking_id: str) -> Optional[BookingOut]:
    """Sets status='cancelled' on an owned booking. Returns updated booking or None if not found."""
    existing = await get_booking_for_user(user_id, booking_id)
    if not existing:
        return None
    await execute(
        "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND user_id = ?",
        (booking_id, user_id),
    )
    return await get_booking_for_user(user_id, booking_id)
