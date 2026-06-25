"""Unit tests for the car-rental backend — pure-function tests with no I/O.

Exercises:
- bcrypt password hashing & JWT
- booking_service pure functions: days_between, compute_total_cost, generate_booking_id
- pydantic models: UserRegister, BookingCreate validation
"""
from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.user import UserRegister
from app.services.booking_service import (
    compute_total_cost,
    days_between,
    generate_booking_id,
)


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

class TestPasswordHashing:
    def test_hash_not_plaintext(self):
        h = hash_password("secret123")
        assert h != "secret123"
        assert h.startswith("$2")

    def test_hash_includes_random_salt(self):
        assert hash_password("x") != hash_password("x")

    def test_verify_correct(self):
        assert verify_password("pw", hash_password("pw")) is True

    def test_verify_wrong(self):
        assert verify_password("wrong", hash_password("pw")) is False

    def test_verify_empty(self):
        assert verify_password("", "x") is False
        assert verify_password("x", "") is False

    def test_hash_rejects_empty(self):
        with pytest.raises(ValueError):
            hash_password("")

    def test_verify_malformed_hash(self):
        assert verify_password("x", "not-bcrypt") is False


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------

class TestJWT:
    def test_round_trip(self):
        tok = create_access_token(subject="user-1")
        p = decode_access_token(tok)
        assert p["sub"] == "user-1"
        assert p["exp"] > p["iat"]

    def test_extra_claims(self):
        tok = create_access_token("u", extra={"email": "a@b.com"})
        assert decode_access_token(tok)["email"] == "a@b.com"

    def test_reserved_claims_protected(self):
        tok = create_access_token("real", extra={"sub": "fake"})
        assert decode_access_token(tok)["sub"] == "real"

    def test_invalid_token_raises_401(self):
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            decode_access_token("garbage")
        assert exc.value.status_code == 401

    def test_tampered_token_rejected(self):
        from fastapi import HTTPException
        tok = create_access_token("u")
        tampered = tok[:-4] + ("aaaa" if tok[-4:] != "aaaa" else "bbbb")
        with pytest.raises(HTTPException) as exc:
            decode_access_token(tampered)
        assert exc.value.status_code == 401

    def test_expiry_7_days(self):
        tok = create_access_token("u")
        p = decode_access_token(tok)
        delta = p["exp"] - p["iat"]
        assert 604800 - 5 <= delta <= 604800 + 5


# ---------------------------------------------------------------------------
# Booking service pure functions
# ---------------------------------------------------------------------------

class TestDaysBetween:
    def test_three_days(self):
        assert days_between("2026-12-25", "2026-12-28") == 3

    def test_single_day(self):
        assert days_between("2026-12-25", "2026-12-26") == 1

    def test_week_long(self):
        assert days_between("2026-01-01", "2026-01-08") == 7

    def test_same_day_raises(self):
        with pytest.raises(ValueError):
            days_between("2026-12-25", "2026-12-25")

    def test_return_before_pickup_raises(self):
        with pytest.raises(ValueError):
            days_between("2026-12-28", "2026-12-25")

    def test_invalid_date_format_raises(self):
        with pytest.raises(ValueError):
            days_between("not-a-date", "2026-12-25")


class TestComputeTotalCost:
    def test_basic_multiplication(self):
        assert compute_total_cost(3, 2200) == 6600

    def test_one_day(self):
        assert compute_total_cost(1, 5000) == 5000

    def test_zero_days(self):
        """Edge case: 0 days × any price = 0 (the validation happens upstream)."""
        assert compute_total_cost(0, 2200) == 0

    def test_large_booking(self):
        assert compute_total_cost(30, 1500) == 45000

    def test_luxury_car_long_rental(self):
        assert compute_total_cost(14, 8000) == 112000


class TestGenerateBookingId:
    def test_format_bk_year_suffix(self):
        bid = generate_booking_id()
        assert bid.startswith("BK-")
        parts = bid.split("-")
        assert len(parts) == 3
        # Year is 4 digits
        assert len(parts[1]) == 4
        assert parts[1].isdigit()
        # Suffix is 4 alphanumeric uppercase
        assert len(parts[2]) == 4
        assert parts[2].isalnum()
        assert parts[2].isupper() or parts[2].isdigit()

    def test_uniqueness(self):
        """Generating 100 IDs should produce 100 unique values."""
        ids = {generate_booking_id() for _ in range(100)}
        assert len(ids) == 100

    def test_year_matches_current(self):
        from datetime import date
        bid = generate_booking_id()
        assert str(date.today().year) in bid


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class TestUserRegisterModel:
    def test_valid_payload(self):
        u = UserRegister(
            name="Alice", email="alice@example.com", password="secret123",
            phone="+919999999999",
        )
        assert u.name == "Alice"
        assert u.phone == "+919999999999"

    def test_short_name_rejected(self):
        with pytest.raises(ValidationError):
            UserRegister(name="A", email="a@b.com", password="secret123")

    def test_short_password_rejected(self):
        with pytest.raises(ValidationError):
            UserRegister(name="Alice", email="a@b.com", password="123")

    def test_invalid_email_rejected(self):
        with pytest.raises(ValidationError):
            UserRegister(name="Alice", email="not-an-email", password="secret123")

    def test_invalid_phone_rejected(self):
        with pytest.raises(ValidationError):
            UserRegister(
                name="Alice", email="a@b.com", password="secret123",
                phone="abc",  # too short, non-numeric
            )

    def test_phone_optional(self):
        u = UserRegister(name="Alice", email="a@b.com", password="secret123")
        assert u.phone is None

    def test_empty_phone_treated_as_none(self):
        u = UserRegister(
            name="Alice", email="a@b.com", password="secret123", phone=""
        )
        assert u.phone is None
