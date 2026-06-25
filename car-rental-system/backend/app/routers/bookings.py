"""Bookings router: create, list, get, cancel. All require Bearer token."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.core.responses import ok, created, error_response
from app.core.security import get_current_user_id
from app.models.booking import BookingCreate
from app.services import booking_service

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.post("")
@router.post("/")
async def create_booking(
    payload: BookingCreate,
    user_id: str = Depends(get_current_user_id),
):
    try:
        result = await booking_service.create_booking(user_id, payload)
    except ValueError as e:
        # Car not found, bad dates, etc.
        return error_response(str(e), status_code=status.HTTP_400_BAD_REQUEST)

    booking = result["booking"]
    warning = result.get("warning")
    message = "Booking created successfully"
    if warning:
        message = f"Booking created successfully. {warning}"
    return created(
        data=booking.model_dump(),
        message=message,
    )


@router.get("")
@router.get("/")
async def list_bookings(user_id: str = Depends(get_current_user_id)):
    bookings = await booking_service.list_bookings_for_user(user_id)
    return ok(
        data=[b.model_dump() for b in bookings],
        message=f"{len(bookings)} booking(s) found",
    )


@router.get("/{booking_id}")
async def get_booking(
    booking_id: str,
    user_id: str = Depends(get_current_user_id),
):
    booking = await booking_service.get_booking_for_user(user_id, booking_id)
    if not booking:
        return error_response(
            f"Booking '{booking_id}' not found for current user",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return ok(data=booking.model_dump(), message="Booking fetched")


@router.delete("/{booking_id}")
async def cancel_booking(
    booking_id: str,
    user_id: str = Depends(get_current_user_id),
):
    updated = await booking_service.cancel_booking(user_id, booking_id)
    if not updated:
        return error_response(
            f"Booking '{booking_id}' not found for current user",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return ok(data=updated.model_dump(), message="Booking cancelled")
