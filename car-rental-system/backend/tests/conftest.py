"""Shared pytest fixtures for the car-rental backend test-suite.

Run all tests:
    cd /home/z/my-project/projects/car-rental-system/backend
    python -m pytest -v
"""

from __future__ import annotations

import os
import sys
import uuid
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

# Fresh test DB so tests never pollute the real car_rental.db
TEST_DB = BACKEND_ROOT / "data" / "test_car_rental.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["PORT"] = "8097"

# IMPORTANT: import config FIRST so it sets the default DB path, then
# override DB_PATH to point at our throwaway test DB. The car backend
# does NOT read DB_PATH from env (unlike exam), so we override directly.
from app.core import config as _cfg  # noqa: E402
from app.core import db as _db  # noqa: E402

_db.set_db_path(str(TEST_DB))
_cfg.DB_PATH = str(TEST_DB)

import pytest  # type: ignore  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def _make_client() -> TestClient:
    """Build a TestClient that works across starlette + httpx versions.

    Older starlette (<0.36) calls `httpx.Client(app=...)` which fails on
    httpx>=0.28 because Client.__init__ no longer accepts `app`. We build
    an ASGITransport explicitly to stay compatible with both.
    """
    try:
        import httpx  # type: ignore

        transport = httpx.ASGITransport(app=app)
        return TestClient(app, transport=transport)
    except (TypeError, AttributeError):
        return TestClient(app)


@pytest.fixture(scope="module")
def client():
    """Module-scoped TestClient — the app seeds once."""
    with _make_client() as c:
        yield c


@pytest.fixture
def unique_email():
    return f"test_{uuid.uuid4().hex[:8]}@example.com"


@pytest.fixture
def registered_user(client, unique_email):
    payload = {
        "name": "Test User",
        "email": unique_email,
        "password": "secret123",
        "phone": "9999999999",
    }
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 201, r.text
    body = r.json()["data"]
    return {
        "name": payload["name"],
        "email": payload["email"],
        "password": payload["password"],
        "phone": payload["phone"],
        "token": body["token"],
        "user": body["user"],
        "headers": {"Authorization": f"Bearer {body['token']}"},
    }


@pytest.fixture
def auth_headers(registered_user):
    return registered_user["headers"]


@pytest.fixture
def future_dates():
    """Return (pickup, return) ISO dates 7-10 days from today."""
    from datetime import date, timedelta

    pickup = (date.today() + timedelta(days=7)).isoformat()
    return_ = (date.today() + timedelta(days=10)).isoformat()
    return pickup, return_
