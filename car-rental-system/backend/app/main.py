"""FastAPI application entrypoint.

Lifespan:
  1. set DB_PATH on the shared db module
  2. init schema (idempotent)
  3. seed cars if table is empty (idempotent)

Routes:
  - GET  /                       -> redirect to /docs
  - GET  /api/health
  - POST /api/auth/register
  - POST /api/auth/login
  - GET  /api/auth/me
  - GET  /api/cars
  - GET  /api/cars/featured
  - GET  /api/cars/{id}
  - GET  /api/meta/categories
  - GET  /api/meta/fuel-types
  - POST /api/bookings
  - GET  /api/bookings
  - GET  /api/bookings/{id}
  - DELETE /api/bookings/{id}
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import (
    APP_NAME,
    APP_VERSION,
    DB_PATH,
    HOST,
    PORT,
    SCHEMA_SQL,
    SERVICE_NAME,
)
from app.core.db import init_schema, set_db_path
from app.core.responses import ok, error_response
from app.routers import auth, bookings, cars, meta
from app.services.car_service import seed_cars_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Configure DB path
    set_db_path(DB_PATH)
    # 2. Init schema (CREATE TABLE IF NOT EXISTS — idempotent)
    await init_schema(SCHEMA_SQL)
    # 3. Seed cars if empty (idempotent)
    inserted = await seed_cars_if_empty()
    if inserted:
        print(f"[startup] Seeded {inserted} cars into the database.")
    else:
        print("[startup] Cars already present — skipping seed.")
    print(f"[startup] {SERVICE_NAME} v{APP_VERSION} listening on http://{HOST}:{PORT}")
    yield


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description=(
        "Car Rental Management System backend. "
        "Browse the fleet, filter by category/fuel/price, book cars, manage bookings. "
        "JWT-authenticated bookings; cars/meta are public."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow all origins for dev, no credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routers
app.include_router(auth.router)
app.include_router(cars.router)
app.include_router(bookings.router)
app.include_router(meta.router)


# --- Exception handlers: enforce our envelope on ALL responses ---
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    """Convert FastAPI's default 422 {detail:[...]} into our envelope."""
    msgs = []
    for err in exc.errors():
        loc = ".".join(str(x) for x in err.get("loc", []) if x not in ("body",))
        msgs.append(f"{loc}: {err.get('msg', 'Invalid value')}".strip(": "))
    message = "Validation failed: " + " | ".join(msgs) if msgs else "Validation failed"
    return error_response(message, status_code=422)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc: StarletteHTTPException):
    """Wrap Starlette/FastAPI HTTPException (404, 401, 405, etc.) in our envelope."""
    return error_response(str(exc.detail), status_code=exc.status_code)


# Root & health
@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get("/api/health", tags=["health"])
async def health():
    return ok(
        data={
            "status": "ok",
            "service": SERVICE_NAME,
            "version": APP_VERSION,
        },
        message="Service is healthy",
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=HOST,
        port=PORT,
        reload=True,
    )
