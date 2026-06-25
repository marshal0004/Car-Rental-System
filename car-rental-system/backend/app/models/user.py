"""User-related Pydantic models."""
from __future__ import annotations

import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

# Phone: optional leading +, then 10-15 digits, spaces, or dashes.
PHONE_REGEX = re.compile(r"^[+]?[\d\s-]{10,15}$")


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    phone: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        if not PHONE_REGEX.match(v):
            raise ValueError("Phone must be 10-15 digits (optional leading +, spaces or dashes allowed)")
        return v


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    created_at: str

    @field_validator("created_at", mode="before")
    @classmethod
    def coerce_created_at(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return str(v)


class AuthResponse(BaseModel):
    user: UserOut
    token: str
