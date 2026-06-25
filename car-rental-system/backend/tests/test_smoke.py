"""Smoke tests — pricing + booking id + car model shape (no DB needed)."""
from __future__ import annotations

from app.services.booking_service import (
    compute_total_cost,
    days_between,
    generate_booking_id,
)


def test_days_between_basic():
    assert days_between("2026-12-25", "2026-12-28") == 3


def test_days_between_single_day():
    assert days_between("2026-12-25", "2026-12-26") == 1


def test_compute_total_cost():
    assert compute_total_cost(3, 2200) == 6600


def test_booking_id_format():
    bid = generate_booking_id()
    assert bid.startswith("BK-")
    parts = bid.split("-")
    assert len(parts) == 3
    assert len(parts[2]) == 4
    assert parts[2].isalnum()
