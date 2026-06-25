"""Functional system tests for the car-rental backend.

Walks through the full user journey: browse cars → search/filter → view
detail → book → list bookings → cancel. Also covers auth, validation,
and the cross-user isolation guarantee.
"""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.functional


# ---------------------------------------------------------------------------
# Envelope contract
# ---------------------------------------------------------------------------

class TestAPIEnvelope:
    def test_health_envelope(self, client):
        r = client.get("/api/health")
        body = r.json()
        assert body["success"] is True
        assert body["data"]["status"] == "ok"
        assert body["data"]["service"] == "car-rental-system-backend"

    def test_404_envelope(self, client):
        r = client.get("/api/cars/missing-car")
        assert r.status_code == 404
        body = r.json()
        assert body["success"] is False

    def test_401_envelope(self, client):
        r = client.get("/api/bookings")
        assert r.status_code == 401
        assert r.json()["success"] is False


# ---------------------------------------------------------------------------
# Cars feature (PRD §5.2: car listing)
# ---------------------------------------------------------------------------

class TestCarsFeature:
    def test_cars_list_has_12_plus(self, client):
        r = client.get("/api/cars")
        items = r.json()["data"]
        assert len(items) >= 12

    def test_car_summary_fields(self, client):
        """PRD: image, name/model, price/day, fuel, seating, availability."""
        r = client.get("/api/cars")
        item = r.json()["data"][0]
        required = {"id", "name", "category", "fuel_type", "price_per_day", "seating_capacity", "is_available"}
        assert required.issubset(set(item.keys()))

    def test_filter_by_category(self, client):
        r = client.get("/api/cars?category=suv")
        items = r.json()["data"]
        assert len(items) >= 1
        assert all(i["category"] == "suv" for i in items)

    def test_filter_by_fuel_type(self, client):
        r = client.get("/api/cars?fuel_type=petrol")
        items = r.json()["data"]
        assert all(i["fuel_type"] == "petrol" for i in items)

    def test_filter_by_transmission(self, client):
        """Spec: cars listing must support transmission filter."""
        r = client.get("/api/cars?transmission=automatic")
        items = r.json()["data"]
        assert len(items) >= 1
        assert all(i["transmission"] == "automatic" for i in items)

    def test_filter_by_transmission_manual(self, client):
        r = client.get("/api/cars?transmission=manual")
        items = r.json()["data"]
        assert len(items) >= 1
        assert all(i["transmission"] == "manual" for i in items)

    def test_filter_combined_transmission_and_category(self, client):
        r = client.get("/api/cars?transmission=automatic&category=suv")
        items = r.json()["data"]
        assert len(items) >= 1
        for i in items:
            assert i["transmission"] == "automatic"
            assert i["category"] == "suv"

    def test_invalid_transmission_422(self, client):
        r = client.get("/api/cars?transmission=invalid")
        assert r.status_code == 422

    def test_filter_by_price_range(self, client):
        r = client.get("/api/cars?min_price=2000&max_price=5000")
        items = r.json()["data"]
        for i in items:
            assert 2000 <= i["price_per_day"] <= 5000

    def test_sort_price_ascending(self, client):
        r = client.get("/api/cars?sort=price_asc")
        items = r.json()["data"]
        prices = [i["price_per_day"] for i in items]
        assert prices == sorted(prices)

    def test_sort_price_descending(self, client):
        r = client.get("/api/cars?sort=price_desc")
        items = r.json()["data"]
        prices = [i["price_per_day"] for i in items]
        assert prices == sorted(prices, reverse=True)

    def test_search_by_name(self, client):
        r = client.get("/api/cars?search=swift")
        items = r.json()["data"]
        assert any("swift" in i["name"].lower() for i in items)

    def test_featured_endpoint(self, client):
        r = client.get("/api/cars/featured")
        items = r.json()["data"]
        assert len(items) >= 1
        assert len(items) <= 6  # capped at 6

    def test_car_detail(self, client):
        r = client.get("/api/cars/maruti-swift")
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["id"] == "maruti-swift"
        # Detail includes full description + features + images
        assert "description" in data
        assert "features" in data
        assert "images" in data

    def test_car_detail_404(self, client):
        r = client.get("/api/cars/missing-car")
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# Meta feature (categories + fuel types for filter UI)
# ---------------------------------------------------------------------------

class TestMetaFeature:
    def test_categories(self, client):
        r = client.get("/api/meta/categories")
        cats = r.json()["data"]
        assert "hatchback" in cats
        assert "sedan" in cats
        assert "suv" in cats
        assert "luxury" in cats

    def test_fuel_types(self, client):
        r = client.get("/api/meta/fuel-types")
        fuels = r.json()["data"]
        assert "petrol" in fuels
        assert "diesel" in fuels


# ---------------------------------------------------------------------------
# Auth flow
# ---------------------------------------------------------------------------

class TestAuthFlow:
    def test_register_login_me(self, client, unique_email):
        r = client.post(
            "/api/auth/register",
            json={
                "name": "Alice",
                "email": unique_email,
                "password": "secret123",
                "phone": "+919999999999",
            },
        )
        assert r.status_code == 201, r.text
        token = r.json()["data"]["token"]

        r2 = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r2.status_code == 200
        assert r2.json()["data"]["email"] == unique_email

        r3 = client.post(
            "/api/auth/login",
            data={"username": unique_email, "password": "secret123"},
        )
        assert r3.status_code == 200
        assert r3.json()["data"]["token"]

    def test_duplicate_register_409(self, client, unique_email):
        client.post(
            "/api/auth/register",
            json={"name": "Alice", "email": unique_email, "password": "secret123"},
        )
        r = client.post(
            "/api/auth/register",
            json={"name": "Bob", "email": unique_email, "password": "secret123"},
        )
        assert r.status_code == 409

    def test_login_wrong_password_401(self, client, unique_email):
        client.post(
            "/api/auth/register",
            json={"name": "Alice", "email": unique_email, "password": "secret123"},
        )
        r = client.post(
            "/api/auth/login",
            data={"username": unique_email, "password": "wrong"},
        )
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# Booking flow (PRD §5.4: booking form) — primary write path
# ---------------------------------------------------------------------------

class TestBookingFlow:
    """Create → list → fetch → cancel — the core booking journey."""

    def test_full_booking_lifecycle(self, client, registered_user, future_dates):
        headers = registered_user["headers"]
        pickup, return_ = future_dates

        # 1. Create booking
        r = client.post(
            "/api/bookings",
            headers=headers,
            json={
                "car_id": "maruti-swift",
                "customer_name": registered_user["name"],
                "email": registered_user["email"],
                "phone": registered_user["phone"],
                "pickup_date": pickup,
                "return_date": return_,
                "pickup_address": "MG Road, Bangalore",
                "special_requests": "Child seat needed",
            },
        )
        assert r.status_code in (200, 201), r.text
        booking = r.json()["data"]
        booking_id = booking["id"]
        assert booking_id.startswith("BK-")
        assert booking["total_days"] == 3
        # Verify cost = days × car's price_per_day (fetched separately)
        car_r = client.get("/api/cars/maruti-swift")
        price_per_day = car_r.json()["data"]["price_per_day"]
        assert booking["total_cost"] == 3 * price_per_day
        assert booking["status"] == "pending"

        # 2. List bookings — must include our booking
        r2 = client.get("/api/bookings", headers=headers)
        assert r2.status_code == 200
        assert any(b["id"] == booking_id for b in r2.json()["data"])

        # 3. Fetch by id
        r3 = client.get(f"/api/bookings/{booking_id}", headers=headers)
        assert r3.status_code == 200
        assert r3.json()["data"]["id"] == booking_id

        # 4. Cancel
        r4 = client.delete(f"/api/bookings/{booking_id}", headers=headers)
        assert r4.status_code == 200

        # 5. Verify cancelled
        r5 = client.get(f"/api/bookings/{booking_id}", headers=headers)
        assert r5.status_code == 200
        assert r5.json()["data"]["status"] == "cancelled"

    def test_bookings_require_auth(self, client):
        assert client.get("/api/bookings").status_code == 401
        assert client.post(
            "/api/bookings", json={"car_id": "maruti-swift"}
        ).status_code == 401

    def test_booking_unknown_car_returns_400_or_404(self, client, auth_headers, future_dates):
        pickup, return_ = future_dates
        r = client.post(
            "/api/bookings",
            headers=auth_headers,
            json={
                "car_id": "missing-car",
                "customer_name": "Xavier",
                "email": "x@y.com",
                "phone": "9999999999",
                "pickup_date": pickup,
                "return_date": return_,
            },
        )
        assert r.status_code in (400, 404)

    def test_booking_return_before_pickup_422(self, client, auth_headers):
        """Date math validation: return_date must be after pickup_date."""
        r = client.post(
            "/api/bookings",
            headers=auth_headers,
            json={
                "car_id": "maruti-swift",
                "customer_name": "Xavier",
                "email": "x@y.com",
                "phone": "9999999999",
                "pickup_date": "2026-12-25",
                "return_date": "2026-12-20",  # before pickup
            },
        )
        assert r.status_code in (400, 422)

    def test_cancel_others_users_booking_404(self, client, unique_email, future_dates):
        """User B cannot cancel User A's booking."""
        pickup, return_ = future_dates

        # User A registers + books
        a = client.post(
            "/api/auth/register",
            json={"name": "Alice", "email": unique_email, "password": "secret123"},
        )
        assert a.status_code == 201, a.text
        a_token = a.json()["data"]["token"]
        a_headers = {"Authorization": f"Bearer {a_token}"}

        r = client.post(
            "/api/bookings",
            headers=a_headers,
            json={
                "car_id": "maruti-swift",
                "customer_name": "Alice",
                "email": unique_email,
                "phone": "9999999999",
                "pickup_date": pickup,
                "return_date": return_,
            },
        )
        assert r.status_code in (200, 201), r.text
        booking_id = r.json()["data"]["id"]

        # User B registers
        import uuid as _uuid
        b_email = f"b_{_uuid.uuid4().hex[:8]}@example.com"
        b = client.post(
            "/api/auth/register",
            json={"name": "Bob", "email": b_email, "password": "secret123"},
        )
        assert b.status_code == 201, b.text
        b_token = b.json()["data"]["token"]
        b_headers = {"Authorization": f"Bearer {b_token}"}

        # B tries to cancel A's booking
        r2 = client.delete(f"/api/bookings/{booking_id}", headers=b_headers)
        assert r2.status_code == 404

    def test_pricing_correctness(self, client, auth_headers, future_dates):
        """Verify the total_cost = days × price_per_day formula."""
        pickup, return_ = future_dates

        # Get car's price_per_day first
        car_r = client.get("/api/cars/maruti-swift")
        price_per_day = car_r.json()["data"]["price_per_day"]

        r = client.post(
            "/api/bookings",
            headers=auth_headers,
            json={
                "car_id": "maruti-swift",
                "customer_name": "Xavier",
                "email": "x@y.com",
                "phone": "9999999999",
                "pickup_date": pickup,
                "return_date": return_,
            },
        )
        assert r.status_code in (200, 201)
        booking = r.json()["data"]
        assert booking["total_days"] == 3
        assert booking["total_cost"] == 3 * price_per_day


# ---------------------------------------------------------------------------
# Validation contract
# ---------------------------------------------------------------------------

class TestValidation:
    def test_register_short_password_422(self, client, unique_email):
        r = client.post(
            "/api/auth/register",
            json={"name": "Alice", "email": unique_email, "password": "123"},
        )
        assert r.status_code == 422

    def test_register_invalid_email_422(self, client):
        r = client.post(
            "/api/auth/register",
            json={"name": "Alice", "email": "not-an-email", "password": "secret123"},
        )
        assert r.status_code == 422

    def test_register_invalid_phone_422(self, client, unique_email):
        r = client.post(
            "/api/auth/register",
            json={
                "name": "Alice", "email": unique_email, "password": "secret123",
                "phone": "abc",
            },
        )
        assert r.status_code == 422

    def test_invalid_sort_param_422(self, client):
        r = client.get("/api/cars?sort=invalid_option")
        assert r.status_code == 422

    def test_missing_body_422(self, client):
        r = client.post("/api/auth/register", json={})
        assert r.status_code == 422
