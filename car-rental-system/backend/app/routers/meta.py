"""Meta router: enum-like catalogs for categories & fuel types."""
from __future__ import annotations

from fastapi import APIRouter

from app.core.responses import ok

router = APIRouter(prefix="/api/meta", tags=["meta"])

CATEGORIES = ["hatchback", "sedan", "suv", "luxury"]
FUEL_TYPES = ["petrol", "diesel", "electric", "cng"]


@router.get("/categories")
async def categories():
    return ok(data=CATEGORIES, message="Categories fetched")


@router.get("/fuel-types")
async def fuel_types():
    return ok(data=FUEL_TYPES, message="Fuel types fetched")
