"""Car service: list (with filters/sort), get, featured, and seeding."""
from __future__ import annotations

import json
from typing import Optional

from app.core.db import fetch_all, fetch_one, execute
from app.models.car import Car, CarSummary, CarListQuery, SortOption


# --- Row <-> model mappers ---

def _row_to_car(row: dict) -> Car:
    return Car(
        id=row["id"],
        name=row["name"],
        model=row["model"],
        year=row["year"],
        category=row["category"],
        fuel_type=row["fuel_type"],
        transmission=row["transmission"],
        seating_capacity=row["seating_capacity"],
        mileage=row["mileage"],
        price_per_day=row["price_per_day"],
        images=json.loads(row["images_json"]),
        features=json.loads(row["features_json"]),
        is_available=bool(row["is_available"]),
        description=row["description"],
        created_at=row["created_at"],
    )


def _row_to_summary(row: dict) -> CarSummary:
    return CarSummary(
        id=row["id"],
        name=row["name"],
        model=row["model"],
        year=row["year"],
        category=row["category"],
        fuel_type=row["fuel_type"],
        transmission=row["transmission"],
        seating_capacity=row["seating_capacity"],
        mileage=row["mileage"],
        price_per_day=row["price_per_day"],
        images=json.loads(row["images_json"]),
        is_available=bool(row["is_available"]),
    )


# --- Sort helpers ---

_SORT_SQL = {
    "price_asc": "price_per_day ASC, name ASC",
    "price_desc": "price_per_day DESC, name ASC",
    "name_asc": "name ASC",
    "newest": "year DESC, created_at DESC",
}


# --- Public API ---

async def seed_cars_if_empty() -> int:
    """Insert seed cars if the cars table is empty. Returns count inserted."""
    existing = await fetch_one("SELECT COUNT(*) AS c FROM cars")
    if existing and existing["c"] > 0:
        return 0

    cars = _seed_cars()
    inserted = 0
    for c in cars:
        await execute(
            """
            INSERT INTO cars (
              id, name, model, year, category, fuel_type, transmission,
              seating_capacity, mileage, price_per_day, images_json,
              features_json, is_available, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                c["id"], c["name"], c["model"], c["year"], c["category"],
                c["fuel_type"], c["transmission"], c["seating_capacity"],
                c["mileage"], c["price_per_day"],
                json.dumps(c["images"]), json.dumps(c["features"]),
                1 if c["is_available"] else 0, c["description"],
            ),
        )
        inserted += 1
    return inserted


async def list_cars(query: CarListQuery) -> list[CarSummary]:
    """Returns filtered + sorted list of cars as CarSummary."""
    sql = (
        "SELECT id, name, model, year, category, fuel_type, transmission, "
        "seating_capacity, mileage, price_per_day, images_json, is_available "
        "FROM cars WHERE 1=1"
    )
    params: list = []
    if query.search:
        sql += " AND (LOWER(name) LIKE ? OR LOWER(model) LIKE ?)"
        like = f"%{query.search.lower()}%"
        params.extend([like, like])
    if query.category:
        sql += " AND category = ?"
        params.append(query.category)
    if query.fuel_type:
        sql += " AND fuel_type = ?"
        params.append(query.fuel_type)
    if query.transmission:
        sql += " AND transmission = ?"
        params.append(query.transmission)
    if query.min_price is not None:
        sql += " AND price_per_day >= ?"
        params.append(query.min_price)
    if query.max_price is not None:
        sql += " AND price_per_day <= ?"
        params.append(query.max_price)
    if query.min_seating is not None:
        sql += " AND seating_capacity >= ?"
        params.append(query.min_seating)
    if query.available_only:
        sql += " AND is_available = 1"

    sort: SortOption = query.sort or "price_asc"
    sql += f" ORDER BY {_SORT_SQL[sort]}"

    rows = await fetch_all(sql, tuple(params))
    return [_row_to_summary(r) for r in rows]


async def get_car(car_id: str) -> Optional[Car]:
    row = await fetch_one("SELECT * FROM cars WHERE id = ?", (car_id,))
    if not row:
        return None
    return _row_to_car(row)


async def list_featured(limit: int = 6) -> list[CarSummary]:
    """Returns up to `limit` featured cars.

    Strategy: pick first available car per category (in fixed category order:
    hatchback, sedan, suv, luxury). Falls back to first car in a category if
    none available there. Caps at 6.
    """
    categories = ["hatchback", "sedan", "suv", "luxury"]
    out: list[CarSummary] = []
    seen_ids: set[str] = set()
    for cat in categories:
        rows = await fetch_all(
            "SELECT id, name, model, year, category, fuel_type, transmission, "
            "seating_capacity, mileage, price_per_day, images_json, is_available "
            "FROM cars WHERE category = ? ORDER BY price_per_day ASC LIMIT 1",
            (cat,),
        )
        if not rows:
            continue
        r = rows[0]
        if r["id"] in seen_ids:
            continue
        out.append(_row_to_summary(r))
        seen_ids.add(r["id"])
        if len(out) >= limit:
            break
    # If we still have room, fill with the cheapest available cars not yet selected.
    if len(out) < limit:
        extra = await fetch_all(
            "SELECT id, name, model, year, category, fuel_type, transmission, "
            "seating_capacity, mileage, price_per_day, images_json, is_available "
            "FROM cars WHERE is_available = 1 ORDER BY price_per_day ASC LIMIT ?",
            (limit * 2,),
        )
        for r in extra:
            if r["id"] in seen_ids:
                continue
            out.append(_row_to_summary(r))
            seen_ids.add(r["id"])
            if len(out) >= limit:
                break
    return out[:limit]


# --- Seed data ---

def _seed_cars() -> list[dict]:
    """Return list of car dicts to seed. At least 12 across 4 categories."""
    cars = [
        # ---- Hatchback (4) ----
        {
            "id": "maruti-swift",
            "name": "Maruti Swift",
            "model": "Swift VXi 2024",
            "year": 2024,
            "category": "hatchback",
            "fuel_type": "petrol",
            "transmission": "manual",
            "seating_capacity": 5,
            "mileage": 22,
            "price_per_day": 2200,
            "images": [
                "/images/cars/maruti-swift-1.webp",
                "/images/cars/maruti-swift-2.webp",
                "/images/cars/maruti-swift-3.webp",
            ],
            "features": ["AC", "Power Steering", "ABS", "Airbags", "Bluetooth", "Music System", "USB Charging"],
            "is_available": True,
            "description": "India's favourite hatchback — peppy, fuel-efficient, and easy to park. Ideal for city runs and weekend getaways.",
        },
        {
            "id": "hyundai-grand-i10-nios",
            "name": "Hyundai Grand i10 Nios",
            "model": "Grand i10 Nios Sportz 2024",
            "year": 2024,
            "category": "hatchback",
            "fuel_type": "petrol",
            "transmission": "manual",
            "seating_capacity": 5,
            "mileage": 20,
            "price_per_day": 2400,
            "images": [
                "/images/cars/hyundai-grand-i10-nios-1.webp",
                "/images/cars/hyundai-grand-i10-nios-2.webp",
                "/images/cars/hyundai-grand-i10-nios-3.webp",
            ],
            "features": ["AC", "Power Steering", "ABS", "Airbags", "Bluetooth", "Touchscreen Infotainment", "Apple CarPlay", "Android Auto"],
            "is_available": True,
            "description": "A premium hatchback with a roomy cabin, modern tech, and refined ride quality. Great for small families.",
        },
        {
            "id": "tata-tiago",
            "name": "Tata Tiago",
            "model": "Tiago XZ+ 2023",
            "year": 2023,
            "category": "hatchback",
            "fuel_type": "cng",
            "transmission": "manual",
            "seating_capacity": 5,
            "mileage": 26,
            "price_per_day": 1900,
            "images": [
                "/images/cars/tata-tiago-1.webp",
                "/images/cars/tata-tiago-2.webp",
                "/images/cars/tata-tiago-3.webp",
            ],
            "features": ["AC", "Power Steering", "ABS", "Airbags", "Bluetooth", "Harman Music System", "USB Charging"],
            "is_available": True,
            "description": "A safe, practical hatchback with a 4-star Global NCAP rating. The CNG variant makes it our most economical option per kilometre.",
        },
        {
            "id": "maruti-baleno",
            "name": "Maruti Baleno",
            "model": "Baleno Zeta 2024",
            "year": 2024,
            "category": "hatchback",
            "fuel_type": "petrol",
            "transmission": "automatic",
            "seating_capacity": 5,
            "mileage": 19,
            "price_per_day": 2700,
            "images": [
                "/images/cars/maruti-baleno-1.webp",
                "/images/cars/maruti-baleno-2.webp",
                "/images/cars/maruti-baleno-3.webp",
            ],
            "features": ["AC", "Power Steering", "ABS", "Airbags", "Bluetooth", "Touchscreen Infotainment", "Apple CarPlay", "Android Auto", "Cruise Control"],
            "is_available": False,
            "description": "A premium hatchback with a spacious cabin, CVT automatic gearbox, and class-leading features. Currently out on rent.",
        },

        # ---- Sedan (4) ----
        {
            "id": "honda-city",
            "name": "Honda City",
            "model": "City ZX CVT 2024",
            "year": 2024,
            "category": "sedan",
            "fuel_type": "petrol",
            "transmission": "automatic",
            "seating_capacity": 5,
            "mileage": 17,
            "price_per_day": 4200,
            "images": [
                "/images/cars/honda-city-1.webp",
                "/images/cars/honda-city-2.webp",
                "/images/cars/honda-city-3.webp",
            ],
            "features": ["AC", "Power Steering", "ABS", "Airbags", "Bluetooth", "Touchscreen Infotainment", "Sunroof", "Cruise Control", "Leather Seats"],
            "is_available": True,
            "description": "The benchmark mid-size sedan — refined engine, CVT gearbox, roomy cabin, and a sunroof. A favourite for business travellers.",
        },
        {
            "id": "hyundai-verna",
            "name": "Hyundai Verna",
            "model": "Verna SX Turbo 2024",
            "year": 2024,
            "category": "sedan",
            "fuel_type": "petrol",
            "transmission": "manual",
            "seating_capacity": 5,
            "mileage": 17,
            "price_per_day": 3900,
            "images": [
                "/images/cars/hyundai-verna-1.webp",
                "/images/cars/hyundai-verna-2.webp",
                "/images/cars/hyundai-verna-3.webp",
            ],
            "features": ["AC", "Power Steering", "ABS", "Airbags", "Bluetooth", "Touchscreen Infotainment", "Sunroof", "Ventilated Seats", "Bose Audio"],
            "is_available": True,
            "description": "A bold, tech-loaded sedan with a turbo-petrol engine and segment-first ventilated seats. Stand out on every drive.",
        },
        {
            "id": "skoda-slavia",
            "name": "Skoda Slavia",
            "model": "Slavia Style 1.0 TSI 2024",
            "year": 2024,
            "category": "sedan",
            "fuel_type": "petrol",
            "transmission": "automatic",
            "seating_capacity": 5,
            "mileage": 18,
            "price_per_day": 4500,
            "images": [
                "/images/cars/skoda-slavia-1.webp",
                "/images/cars/skoda-slavia-2.webp",
                "/images/cars/skoda-slavia-3.webp",
            ],
            "features": ["AC", "Power Steering", "ABS", "Airbags", "Bluetooth", "Touchscreen Infotainment", "Sunroof", "Cruise Control", "Wireless Charging"],
            "is_available": False,
            "description": "A European sedan with the legendary Skoda build quality, peppy TSI engine, and a 6-speed torque-converter automatic.",
        },
        {
            "id": "maruti-ciaz",
            "name": "Maruti Ciaz",
            "model": "Ciaz Alpha 2023",
            "year": 2023,
            "category": "sedan",
            "fuel_type": "petrol",
            "transmission": "manual",
            "seating_capacity": 5,
            "mileage": 20,
            "price_per_day": 3200,
            "images": [
                "/images/cars/maruti-ciaz-1.webp",
                "/images/cars/maruti-ciaz-2.webp",
                "/images/cars/maruti-ciaz-3.webp",
            ],
            "features": ["AC", "Power Steering", "ABS", "Airbags", "Bluetooth", "Touchscreen Infotainment", "Cruise Control", "Reverse Camera", "Keyless Entry"],
            "is_available": True,
            "description": "A spacious, fuel-efficient sedan with class-leading rear-seat legroom. Excellent value for long trips.",
        },

        # ---- SUV (5) ----
        {
            "id": "hyundai-creta",
            "name": "Hyundai Creta",
            "model": "Creta SX Diesel AT 2024",
            "year": 2024,
            "category": "suv",
            "fuel_type": "diesel",
            "transmission": "automatic",
            "seating_capacity": 5,
            "mileage": 18,
            "price_per_day": 5500,
            "images": [
                "/images/cars/hyundai-creta-1.webp",
                "/images/cars/hyundai-creta-2.webp",
                "/images/cars/hyundai-creta-3.webp",
            ],
            "features": ["AC", "Power Steering", "ABS", "Airbags", "Bluetooth", "Touchscreen Infotainment", "Sunroof", "Cruise Control", "Ventilated Seats"],
            "is_available": True,
            "description": "India's best-selling mid-size SUV. Boxy stance, diesel-automatic combo, and a long features list make it perfect for highways.",
        },
        {
            "id": "tata-harrier",
            "name": "Tata Harrier",
            "model": "Harrier Fearless 2024",
            "year": 2024,
            "category": "suv",
            "fuel_type": "diesel",
            "transmission": "automatic",
            "seating_capacity": 5,
            "mileage": 16,
            "price_per_day": 5800,
            "images": [
                "/images/cars/tata-harrier-1.webp",
                "/images/cars/tata-harrier-2.webp",
                "/images/cars/tata-harrier-3.webp",
            ],
            "features": ["AC", "Power Steering", "ABS", "Airbags", "Bluetooth", "Touchscreen Infotainment", "Panoramic Sunroof", "Cruise Control", "JBL Audio", "ADAS"],
            "is_available": True,
            "description": "A butch, 5-star safety-rated SUV built on Land Rover's D8 platform. Great ride, panoramic sunroof, and ADAS safety tech.",
        },
        {
            "id": "mahindra-xuv700",
            "name": "Mahindra XUV700",
            "model": "XUV700 AX7 Diesel 2024",
            "year": 2024,
            "category": "suv",
            "fuel_type": "diesel",
            "transmission": "automatic",
            "seating_capacity": 7,
            "mileage": 15,
            "price_per_day": 6500,
            "images": [
                "/images/cars/mahindra-xuv700-1.webp",
                "/images/cars/mahindra-xuv700-2.webp",
                "/images/cars/mahindra-xuv700-3.webp",
            ],
            "features": ["AC", "Power Steering", "ABS", "Airbags", "Bluetooth", "Touchscreen Infotainment", "Dual Sunroof", "Cruise Control", "ADAS", "Sony 3D Audio"],
            "is_available": False,
            "description": "A 7-seater flagship SUV with twin-screen dashboard, ADAS Level 2, and dual-sunroof. Ideal for large families and road trips.",
        },
        {
            "id": "kia-seltos",
            "name": "Kia Seltos",
            "model": "Seltos GTX Turbo 2024",
            "year": 2024,
            "category": "suv",
            "fuel_type": "petrol",
            "transmission": "automatic",
            "seating_capacity": 5,
            "mileage": 16,
            "price_per_day": 5200,
            "images": [
                "/images/cars/kia-seltos-1.webp",
                "/images/cars/kia-seltos-2.webp",
                "/images/cars/kia-seltos-3.webp",
            ],
            "features": ["AC", "Power Steering", "ABS", "Airbags", "Bluetooth", "Touchscreen Infotainment", "Sunroof", "Bose Audio", "Wireless Charging", "Ventilated Seats"],
            "is_available": True,
            "description": "A stylish, sporty SUV with a turbo-petrol engine, Bose sound, and head-up display. Great for young families.",
        },
        {
            "id": "maruti-grand-vitara",
            "name": "Maruti Grand Vitara",
            "model": "Grand Vitara Alpha Strong Hybrid 2024",
            "year": 2024,
            "category": "suv",
            "fuel_type": "petrol",
            "transmission": "automatic",
            "seating_capacity": 5,
            "mileage": 27,
            "price_per_day": 4800,
            "images": [
                "/images/cars/maruti-grand-vitara-1.webp",
                "/images/cars/maruti-grand-vitara-2.webp",
                "/images/cars/maruti-grand-vitara-3.webp",
            ],
            "features": ["AC", "Power Steering", "ABS", "Airbags", "Bluetooth", "Touchscreen Infotainment", "Panoramic Sunroof", "Cruise Control", "360 Camera", "Wireless Charging"],
            "is_available": True,
            "description": "A strong-hybrid SUV returning class-leading 27 km/l. All-wheel-drive option and a panoramic sunroof round out a refined package.",
        },

        # ---- Luxury (3) ----
        {
            "id": "bmw-5-series",
            "name": "BMW 5 Series",
            "model": "530i M Sport 2024",
            "year": 2024,
            "category": "luxury",
            "fuel_type": "petrol",
            "transmission": "automatic",
            "seating_capacity": 5,
            "mileage": 14,
            "price_per_day": 18000,
            "images": [
                "/images/cars/bmw-5-series-1.webp",
                "/images/cars/bmw-5-series-2.webp",
                "/images/cars/bmw-5-series-3.webp",
            ],
            "features": ["AC", "Power Steering", "ABS", "Airbags", "Bluetooth", "Touchscreen Infotainment", "Sunroof", "Cruise Control", "Leather Seats", "Harman Kardon Audio", "Adaptive LED Headlights"],
            "is_available": True,
            "description": "The benchmark sport sedan — refined 2.0L turbo, ZF 8-speed automatic, adaptive suspension, and a beautifully crafted cabin.",
        },
        {
            "id": "mercedes-e-class",
            "name": "Mercedes E-Class",
            "model": "E 200 Expression 2024",
            "year": 2024,
            "category": "luxury",
            "fuel_type": "petrol",
            "transmission": "automatic",
            "seating_capacity": 5,
            "mileage": 13,
            "price_per_day": 22000,
            "images": [
                "/images/cars/mercedes-e-class-1.webp",
                "/images/cars/mercedes-e-class-2.webp",
                "/images/cars/mercedes-e-class-3.webp",
            ],
            "features": ["AC", "Power Steering", "ABS", "Airbags", "Bluetooth", "Touchscreen Infotainment", "Sunroof", "Cruise Control", "Leather Seats", "Burmester Audio", "Ambient Lighting", "Air Suspension"],
            "is_available": True,
            "description": "The defining business-class sedan — extended wheelbase, air suspension, and Burmester audio. The ultimate chauffeur-driven experience.",
        },
        {
            "id": "audi-a6",
            "name": "Audi A6",
            "model": "A6 45 TFSi Premium Plus 2024",
            "year": 2024,
            "category": "luxury",
            "fuel_type": "petrol",
            "transmission": "automatic",
            "seating_capacity": 5,
            "mileage": 14,
            "price_per_day": 20000,
            "images": [
                "/images/cars/audi-a6-1.webp",
                "/images/cars/audi-a6-2.webp",
                "/images/cars/audi-a6-3.webp",
            ],
            "features": ["AC", "Power Steering", "ABS", "Airbags", "Bluetooth", "Touchscreen Infotainment", "Sunroof", "Cruise Control", "Leather Seats", "Bang & Olufsen Audio", "Matrix LED", "Virtual Cockpit"],
            "is_available": False,
            "description": "A understated luxury sedan with Quattro all-wheel drive, Bang & Olufsen sound, and a minimalist tech-forward cabin. Currently on a long-term lease.",
        },
    ]
    return cars
