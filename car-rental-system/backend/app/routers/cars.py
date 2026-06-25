"""Cars router: list with filters, get by id, featured."""
from __future__ import annotations

from fastapi import APIRouter, status

from app.core.responses import ok, error_response
from app.models.car import CarListQuery
from app.services import car_service

router = APIRouter(prefix="/api/cars", tags=["cars"])


@router.get("")
@router.get("/")
async def list_cars(
    search: str | None = None,
    category: str | None = None,
    fuel_type: str | None = None,
    transmission: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    min_seating: int | None = None,
    available_only: bool | None = False,
    sort: str = "price_asc",
):
    # Validate query into CarListQuery — returns 422 envelope on bad input.
    try:
        q = CarListQuery(
            search=search,
            category=category,
            fuel_type=fuel_type,
            transmission=transmission,
            min_price=min_price,
            max_price=max_price,
            min_seating=min_seating,
            available_only=available_only,
            sort=sort,  # type: ignore[arg-type]
        )
    except Exception as e:
        return error_response(
            f"Invalid query parameters: {e}",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    cars = await car_service.list_cars(q)
    return ok(
        data=[c.model_dump() for c in cars],
        message=f"{len(cars)} car(s) found",
    )


@router.get("/featured")
async def featured_cars():
    cars = await car_service.list_featured(limit=6)
    return ok(
        data=[c.model_dump() for c in cars],
        message=f"{len(cars)} featured car(s)",
    )


@router.get("/{car_id}")
async def get_car(car_id: str):
    car = await car_service.get_car(car_id)
    if not car:
        return error_response(
            f"Car with id '{car_id}' not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return ok(data=car.model_dump(), message="Car fetched")
