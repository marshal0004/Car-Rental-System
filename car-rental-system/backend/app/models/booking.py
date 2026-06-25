"""Booking-related Pydantic models."""
from __future__ import annotations

import re
from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

PHONE_REGEX = re.compile(r"^[+]?[\d\s-]{10,15}$")


BookingStatus = Literal["pending", "confirmed", "cancelled"]


class BookingCreate(BaseModel):
    car_id: str = Field(..., min_length=1, max_length=100)
    customer_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=20)
    pickup_date: str  # YYYY-MM-DD
    return_date: str  # YYYY-MM-DD
    pickup_address: Optional[str] = Field(default=None, max_length=300)
    special_requests: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not PHONE_REGEX.match(v):
            raise ValueError("Phone must be 10-15 digits (optional leading +, spaces or dashes allowed)")
        return v

    @field_validator("pickup_date", "return_date")
    @classmethod
    def validate_iso_date(cls, v: str) -> str:
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")
        return v

    @model_validator(mode="after")
    def check_dates(self) -> "BookingCreate":
        p = date.fromisoformat(self.pickup_date)
        r = date.fromisoformat(self.return_date)
        today = date.today()
        if p < today:
            raise ValueError("Pickup date must be today or later")
        if r <= p:
            raise ValueError("Return date must be after pickup date")
        return self


class BookingOut(BaseModel):
    id: str
    user_id: str
    car_id: str
    car_name: str
    customer_name: str
    email: str
    phone: str
    pickup_date: str
    return_date: str
    pickup_address: Optional[str] = None
    special_requests: Optional[str] = None
    total_days: int
    total_cost: int
    status: BookingStatus
    created_at: str
