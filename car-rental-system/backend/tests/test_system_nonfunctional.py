"""Non-functional system tests for the car-rental backend.

Performance, security, reliability, and HTTP-compat checks.
"""
from __future__ import annotations

import concurrent.futures
import time

import pytest

pytestmark = pytest.mark.nonfunctional


class TestPerformance:
    def test_health_under_500ms(self, client):
        t0 = time.perf_counter()
        r = client.get("/api/health")
        elapsed_ms = (time.perf_counter() - t0) * 1000
        assert r.status_code == 200
        assert elapsed_ms < 500

    def test_cars_list_under_1000ms(self, client):
        t0 = time.perf_counter()
        r = client.get("/api/cars")
        elapsed_ms = (time.perf_counter() - t0) * 1000
        assert r.status_code == 200
        assert elapsed_ms < 1000

    def test_concurrent_readers(self, client):
        def fetch():
            return client.get("/api/cars").status_code
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
            results = list(ex.map(lambda _: fetch(), range(10)))
        assert all(s == 200 for s in results)


class TestSecurity:
    def test_missing_token_blocks_bookings(self, client):
        r = client.get("/api/bookings")
        assert r.status_code == 401

    def test_garbage_token_rejected(self, client):
        r = client.get(
            "/api/bookings",
            headers={"Authorization": "Bearer not.real"},
        )
        assert r.status_code == 401

    def test_tampered_token_rejected(self, client, registered_user):
        valid = registered_user["token"]
        tampered = valid[:-4] + ("aaaa" if valid[-4:] != "aaaa" else "bbbb")
        r = client.get(
            "/api/bookings",
            headers={"Authorization": f"Bearer {tampered}"},
        )
        assert r.status_code == 401

    def test_sql_injection_in_search(self, client):
        r = client.get("/api/cars?search=' OR 1=1; --")
        assert r.status_code in (200, 422)
        if r.status_code == 200:
            items = r.json()["data"]
            # No data leak — should not return all cars for a SQLi payload
            # (parameterised queries treat it as a literal string match)
            for item in items:
                assert "OR 1=1" not in item.get("name", "")

    def test_sql_injection_in_email_register(self, client):
        r = client.post(
            "/api/auth/register",
            json={
                "name": "Alice",
                "email": "x@y.com' OR '1'='1",
                "password": "secret123",
            },
        )
        assert r.status_code in (422, 409, 201)
        assert r.status_code != 500

    def test_cors_preflight(self, client):
        r = client.options(
            "/api/health",
            headers={
                "Origin": "http://localhost:3003",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert r.status_code in (200, 204)

    def test_password_never_returned(self, client, unique_email):
        r = client.post(
            "/api/auth/register",
            json={"name": "Alice", "email": unique_email, "password": "secret123"},
        )
        body = r.text.lower()
        assert "password_hash" not in body
        assert "secret123" not in body

    def test_expired_token_rejected(self, client):
        from app.core.security import JWT_SECRET, JWT_ALGORITHM
        import jwt as _jwt
        from datetime import datetime, timedelta, timezone
        expired = _jwt.encode(
            {
                "sub": "fake-user",
                "iat": int((datetime.now(timezone.utc) - timedelta(days=10)).timestamp()),
                "exp": int((datetime.now(timezone.utc) - timedelta(days=1)).timestamp()),
            },
            JWT_SECRET,
            algorithm=JWT_ALGORITHM,
        )
        r = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {expired}"},
        )
        assert r.status_code == 401


class TestReliability:
    def test_unknown_route_404_envelope(self, client):
        r = client.get("/api/missing")
        assert r.status_code == 404
        assert r.json()["success"] is False

    def test_method_not_allowed(self, client):
        r = client.put("/api/health")
        assert r.status_code in (405, 404, 422)

    def test_wrong_content_type_login(self, client):
        r = client.post(
            "/api/auth/login",
            json={"username": "x@y.com", "password": "secret123"},
        )
        assert r.status_code in (422, 401)

    def test_large_special_requests_no_crash(self, client, auth_headers, future_dates):
        """A 64KB special_requests field should be handled cleanly."""
        pickup, return_ = future_dates
        huge = "x" * (64 * 1024)
        r = client.post(
            "/api/bookings",
            headers=auth_headers,
            json={
                "car_id": "maruti-swift",
                "customer_name": "Alice",
                "email": "x@y.com",
                "phone": "9999999999",
                "pickup_date": pickup,
                "return_date": return_,
                "special_requests": huge,
            },
        )
        assert r.status_code in (201, 422, 413)
        assert r.status_code != 500


class TestHTTPCompat:
    def test_root_redirects_to_docs(self, client):
        r = client.get("/", follow_redirects=False)
        assert r.status_code in (302, 307)

    def test_openapi_schema(self, client):
        r = client.get("/openapi.json")
        assert r.status_code == 200
        assert "/api/health" in r.json()["paths"]

    def test_docs_page(self, client):
        r = client.get("/docs")
        assert r.status_code == 200

    def test_health_get_only(self, client):
        r = client.post("/api/health")
        assert r.status_code in (405, 404, 422)

    def test_json_content_type(self, client):
        r = client.get("/api/health")
        assert r.headers.get("content-type", "").startswith("application/json")
