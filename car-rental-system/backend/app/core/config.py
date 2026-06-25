"""
Car Rental backend configuration.

- DB_PATH: SQLite file at backend/data/car_rental.db
- JWT_SECRET: signed in dev; override in prod via env var JWT_SECRET
- PORT: 8003 (car-rental backend)
"""
from __future__ import annotations

import os
import secrets
from pathlib import Path

# --- Paths ---
# backend/app/core/config.py  ->  backend/
BACKEND_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH: str = str(DATA_DIR / "car_rental.db")

# --- Server ---
PORT: int = int(os.environ.get("PORT", "8003"))
HOST: str = os.environ.get("HOST", "0.0.0.0")

# --- Auth ---
# Allow override via env var; fall back to a stable dev secret (random per
# process would log everyone out on every restart — bad DX).
JWT_SECRET: str = os.environ.get(
    "JWT_SECRET",
    "car-rental-dev-secret-" + secrets.token_hex(16),
)
# Override the shared security module's default secret at import time.
import app.core.security as _security  # noqa: E402

_security.JWT_SECRET = JWT_SECRET

# --- App metadata ---
APP_NAME = "Car Rental Management System"
APP_VERSION = "1.0.0"
SERVICE_NAME = "car-rental-system-backend"

# --- Schema ---
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cars (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hatchback','sedan','suv','luxury')),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol','diesel','electric','cng')),
  transmission TEXT NOT NULL CHECK (transmission IN ('manual','automatic')),
  seating_capacity INTEGER NOT NULL CHECK (seating_capacity BETWEEN 2 AND 9),
  mileage INTEGER NOT NULL,
  price_per_day INTEGER NOT NULL,
  images_json TEXT NOT NULL,
  features_json TEXT NOT NULL,
  is_available INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  car_id TEXT NOT NULL,
  car_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  pickup_date TEXT NOT NULL,
  return_date TEXT NOT NULL,
  pickup_address TEXT,
  special_requests TEXT,
  total_days INTEGER NOT NULL,
  total_cost INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cars_category ON cars(category);
CREATE INDEX IF NOT EXISTS idx_cars_fuel_type ON cars(fuel_type);
CREATE INDEX IF NOT EXISTS idx_cars_price ON cars(price_per_day);
CREATE INDEX IF NOT EXISTS idx_cars_available ON cars(is_available);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at);
"""
