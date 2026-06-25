"""Car-related Pydantic models."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


CarCategory = Literal["hatchback", "sedan", "suv", "luxury"]
FuelType = Literal["petrol", "diesel", "electric", "cng"]
Transmission = Literal["manual", "automatic"]
SortOption = Literal["price_asc", "price_desc", "name_asc", "newest"]


class Car(BaseModel):
    """Full car record returned by single-car endpoints."""
    id: str
    name: str
    model: str
    year: int
    category: CarCategory
    fuel_type: FuelType
    transmission: Transmission
    seating_capacity: int
    mileage: int
    price_per_day: int
    images: list[str]
    features: list[str]
    is_available: bool
    description: str
    created_at: str


class CarSummary(BaseModel):
    """Compact car record for listing/featured endpoints (subset of fields)."""
    id: str
    name: str
    model: str
    year: int
    category: CarCategory
    fuel_type: FuelType
    transmission: Transmission
    seating_capacity: int
    mileage: int
    price_per_day: int
    images: list[str]
    is_available: bool


class CarListQuery(BaseModel):
    """Validated query params for GET /api/cars."""
    search: Optional[str] = None
    category: Optional[CarCategory] = None
    fuel_type: Optional[FuelType] = None
    transmission: Optional[Transmission] = None
    min_price: Optional[int] = Field(default=None, ge=0)
    max_price: Optional[int] = Field(default=None, ge=0)
    min_seating: Optional[int] = Field(default=None, ge=2, le=9)
    available_only: Optional[bool] = False
    sort: SortOption = "price_asc"
