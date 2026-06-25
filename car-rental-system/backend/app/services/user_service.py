"""User service: registration, lookup, password verification."""
from __future__ import annotations

import uuid
from typing import Optional

from app.core.db import fetch_one, execute
from app.core.security import hash_password, verify_password


async def create_user(name: str, email: str, password: str, phone: Optional[str]) -> dict:
    """Create a new user. Returns the new user row as a dict (without password_hash).

    Raises ValueError if email is already taken (caller should map to 409).
    """
    existing = await fetch_one("SELECT id FROM users WHERE email = ?", (email.lower(),))
    if existing:
        raise ValueError("Email already registered")

    user_id = str(uuid.uuid4())
    password_hash = hash_password(password)
    await execute(
        """
        INSERT INTO users (id, name, email, password_hash, phone)
        VALUES (?, ?, ?, ?, ?)
        """,
        (user_id, name, email.lower(), password_hash, phone),
    )
    row = await fetch_one("SELECT id, name, email, phone, created_at FROM users WHERE id = ?", (user_id,))
    return row  # type: ignore[return-value]


async def authenticate(email: str, password: str) -> Optional[dict]:
    """Returns user dict (without password_hash) if credentials valid, else None."""
    row = await fetch_one(
        "SELECT id, name, email, phone, created_at, password_hash FROM users WHERE email = ?",
        (email.lower(),),
    )
    if not row:
        return None
    if not verify_password(password, row["password_hash"]):
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "phone": row["phone"],
        "created_at": row["created_at"],
    }


async def get_user_by_id(user_id: str) -> Optional[dict]:
    return await fetch_one(
        "SELECT id, name, email, phone, created_at FROM users WHERE id = ?",
        (user_id,),
    )
