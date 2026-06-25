# Car Rental Management System — Backend

A production-grade FastAPI backend for a car rental platform. Provides JWT-authenticated
user accounts, a browsable car fleet with rich search/filter/sort, server-computed
booking pricing, and per-user booking management. SQLite (via aiosqlite) for storage —
zero external services required.

- **Port:** `8003`
- **Docs (Swagger UI):** http://localhost:8003/docs
- **ReDoc:** http://localhost:8003/redoc
- **DB file:** `data/car_rental.db` (auto-created on first run)

---

## Quick start

```bash
cd /home/z/my-project/projects/car-rental-system/backend

# (optional) create a venv
python -m venv .venv && source .venv/bin/activate

# install deps
pip install -r requirements.txt

# run (binds 0.0.0.0:8003, reload enabled)
bash run.sh
# OR
python run.py
```

On first startup the backend will:
1. Create `data/car_rental.db` if missing.
2. Apply the schema (`CREATE TABLE IF NOT EXISTS …`).
3. Seed **16 cars** across 4 categories if the `cars` table is empty.

Subsequent restarts are idempotent — no duplicate seed rows, no schema errors.

---

## Tech stack

| Layer        | Choice                                |
|--------------|---------------------------------------|
| Framework    | FastAPI                               |
| ASGI server  | uvicorn[standard]                     |
| Language     | Python 3.12 (with `from __future__ import annotations`) |
| Validation   | Pydantic v2                           |
| Auth         | PyJWT + bcrypt, single access token, 7-day expiry |
| DB           | SQLite via aiosqlite                  |
| Forms        | python-multipart (OAuth2PasswordRequestForm) |
| CORS         | All origins allowed, credentials off (dev) |

All responses use the envelope:

```json
{ "success": true, "data": <payload>, "message": "..." }
```

---

## Endpoint table

| Method | Path                       | Auth | Description                                                       |
|--------|----------------------------|------|-------------------------------------------------------------------|
| GET    | `/`                        | —    | Redirect to `/docs`.                                              |
| GET    | `/api/health`              | —    | Health check (`{status, service, version}`).                      |
| POST   | `/api/auth/register`       | —    | Register `{name, email, password, phone?}`. Returns `{user, token}`. |
| POST   | `/api/auth/login`          | —    | OAuth2 password flow (`username` = email). Returns `{user, token}`. |
| GET    | `/api/auth/me`             | JWT  | Current user profile.                                             |
| GET    | `/api/cars`                | —    | List with `search, category, fuel_type, min_price, max_price, min_seating, available_only, sort`. |
| GET    | `/api/cars/featured`       | —    | Up to 6 featured cars (cheapest available per category).          |
| GET    | `/api/cars/{id}`           | —    | Full car detail or 404.                                           |
| GET    | `/api/meta/categories`     | —    | `["hatchback","sedan","suv","luxury"]`.                           |
| GET    | `/api/meta/fuel-types`     | —    | `["petrol","diesel","electric","cng"]`.                           |
| POST   | `/api/bookings`            | JWT  | Create booking; server computes `total_days`, `total_cost`, `id`. |
| GET    | `/api/bookings`            | JWT  | List bookings for current user (newest first).                    |
| GET    | `/api/bookings/{id}`       | JWT  | Get one booking (if owned by caller).                             |
| DELETE | `/api/bookings/{id}`       | JWT  | Cancel a booking (sets `status='cancelled'`).                     |

**Sort options** for `GET /api/cars`: `price_asc` (default), `price_desc`, `name_asc`, `newest`.

---

## Curl examples

Replace `http://localhost:8003` with your actual host if not running locally.
`jq` is recommended for pretty-printing JSON.

### 1. Health check

```bash
curl -s http://localhost:8003/api/health | jq
```

### 2. Register a new user

```bash
curl -s -X POST http://localhost:8003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Arjun Mehta",
    "email": "arjun@example.com",
    "password": "secret123",
    "phone": "+91 98765 43210"
  }' | jq
```

Response includes `data.token` — copy it for authenticated calls.

### 3. Login (OAuth2 password flow)

```bash
curl -s -X POST http://localhost:8003/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=arjun@example.com&password=secret123" | jq
```

### 4. List cars with filters (SUV, sorted by price ascending)

```bash
curl -s "http://localhost:8003/api/cars?category=suv&sort=price_asc" | jq
```

### 5. List cars by price range

```bash
curl -s "http://localhost:8003/api/cars?min_price=2000&max_price=5000" | jq
```

### 6. Get a single car's detail

```bash
curl -s http://localhost:8003/api/cars/maruti-swift | jq
```

### 7. Get the current user (auth required)

```bash
TOKEN="<paste-token-from-step-2-or-3>"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8003/api/auth/me | jq
```

### 8. Create a booking (auth required)

```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8003/api/bookings \
  -d '{
    "car_id": "maruti-swift",
    "customer_name": "Arjun Mehta",
    "email": "arjun@example.com",
    "phone": "+91 98765 43210",
    "pickup_date": "2026-12-25",
    "return_date": "2026-12-28",
    "pickup_address": "MG Road, Bangalore",
    "special_requests": "Child seat needed"
  }' | jq
```

Server returns `total_days: 3`, `total_cost: 6600` (3 × ₹2200), and an auto-generated
`id` like `BK-2026-A7X9`.

### 9. List my bookings

```bash
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8003/api/bookings | jq
```

### 10. Cancel a booking

```bash
curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:8003/api/bookings/BK-2026-A7X9 | jq
```

---

## Validation rules

| Field          | Rule                                                                 |
|----------------|----------------------------------------------------------------------|
| `email`        | Pydantic `EmailStr` (RFC-valid).                                     |
| `password`     | ≥ 6 chars.                                                           |
| `phone`        | Regex `^[+]?[\d\s-]{10,15}$` (optional on register, required on booking). |
| `customer_name`| 2–100 chars.                                                         |
| `pickup_date`  | `YYYY-MM-DD`, must be ≥ today.                                       |
| `return_date`  | `YYYY-MM-DD`, must be > `pickup_date`.                               |
| `category`     | One of `hatchback`, `sedan`, `suv`, `luxury`.                        |
| `fuel_type`    | One of `petrol`, `diesel`, `electric`, `cng`.                        |
| `transmission` | One of `manual`, `automatic`.                                        |
| `seating_capacity` | Integer in `[2, 9]`.                                             |

---

## Pricing logic (server-side, pure functions)

```python
from datetime import date

def days_between(pickup: str, return_: str) -> int:
    p = date.fromisoformat(pickup)
    r = date.fromisoformat(return_)
    delta = (r - p).days
    if delta < 1:
        raise ValueError("Return date must be after pickup date")
    return delta

def compute_total_cost(days: int, price_per_day: int) -> int:
    return days * price_per_day
```

Booking ID format: `BK-YYYY-XXXX` where `YYYY` = current year and `XXXX` is a 4-char
uppercase alphanumeric suffix.

---

## Car catalog authoring guide

Cars live in the SQLite `cars` table, seeded on first startup from
`app/services/car_service.py::_seed_cars()`. To add a new car:

1. Open `app/services/car_service.py`.
2. Add a new dict to the list returned by `_seed_cars()`. Required keys:

   ```python
   {
       "id": "hyundai-venue",              # unique, kebab-case
       "name": "Hyundai Venue",
       "model": "Venue SX Turbo 2024",
       "year": 2024,                       # 2022-2025
       "category": "suv",                  # hatchback | sedan | suv | luxury
       "fuel_type": "petrol",              # petrol | diesel | electric | cng
       "transmission": "manual",           # manual | automatic
       "seating_capacity": 5,              # 2-9
       "mileage": 18,                      # km/l (use 0 for electric)
       "price_per_day": 4500,              # INR
       "images": [
           "/images/cars/hyundai-venue-1.webp",
           "/images/cars/hyundai-venue-2.webp",
           "/images/cars/hyundai-venue-3.webp",
       ],
       "features": [
           "AC", "Power Steering", "ABS", "Airbags",
           "Bluetooth", "Touchscreen Infotainment", "Sunroof",
       ],
       "is_available": True,
       "description": "A compact SUV with a turbo-petrol engine and segment-first features.",
   }
   ```

3. Stop the server, delete `data/car_rental.db`, and restart. The `cars` table
   will be re-seeded with your new entry.

   > To preserve existing bookings while adding a car, instead insert directly via
   > `sqlite3 data/car_rental.db` — the schema is identical to the dict shape above
   > except `images` and `features` are stored as JSON strings (`images_json`,
   > `features_json`).

Guidelines:
- Use kebab-case ids (matches URL conventions).
- 3 image paths per car (front, side, interior) — typically `/images/cars/<id>-{1,2,3}.webp`.
- 5–8 features per car for filtering clarity.
- Set `is_available: False` for cars currently on rent (still bookable, just with a warning).

---

## Project layout

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                # FastAPI app + lifespan + router includes
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py          # DB_PATH, JWT_SECRET, PORT=8003, schema DDL
│   │   ├── security.py        # JWT + bcrypt (copied from _shared/)
│   │   ├── db.py              # aiosqlite helpers (copied from _shared/)
│   │   └── responses.py       # response envelope helpers (copied from _shared/)
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py            # /api/auth/*
│   │   ├── cars.py            # /api/cars/*
│   │   ├── bookings.py        # /api/bookings/*
│   │   └── meta.py            # /api/meta/*
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── car.py
│   │   └── booking.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   ├── car_service.py     # list/get/featured + seed_cars_if_empty
│   │   └── booking_service.py # create/list/get/cancel + pricing
│   └── schemas/
│       └── __init__.py
├── data/
│   └── .gitkeep               # car_rental.db auto-created here
├── tests/
│   ├── __init__.py
│   └── test_smoke.py          # pricing + booking-id unit tests
├── requirements.txt
├── run.sh                     # bash launcher
├── run.py                     # python launcher
└── README.md
```

---

## Notes & caveats

- **No refresh tokens.** A single access token with 7-day expiry is issued at
  login/register. Re-login when it expires.
- **DB is a single file** at `data/car_rental.db`. Back it up by copying the file.
- **CORS is wide-open** for dev (`allow_origins=["*"]`, `allow_credentials=False`).
  Tighten this in production.
- **Booking unavailable cars is allowed** — the response message warns that the
  fleet team will confirm availability. This is intentional per MVP spec.
- **`electric` cars have `mileage: 0`** by convention (range is a separate
  concept; not modelled in MVP).

---

*End of README — Car Rental Management System backend*
