"""
Shared security utilities for all 3 backends (cafe, exam, car-rental).
JWT issuance, password hashing, current-user dependency.

Each backend copies this file to its own backend/app/core/security.py
so the backend folder remains fully self-contained (no imports crossing
project boundaries — keeps the "no code outside backend/" rule clean).
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# ---------- Config ----------

# Each backend overrides these by importing and reassigning before app startup,
# OR by setting env vars. Defaults below are sane for dev.
JWT_SECRET = "CHANGE_ME_IN_PRODUCTION_please_use_a_long_random_string_at_least_32_chars"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ---------- Password hashing ----------

def hash_password(plain: str) -> str:
    """bcrypt hash with auto-salt. Returns str (not bytes) for DB storage."""
    if not plain:
        raise ValueError("Password cannot be empty")
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Constant-time bcrypt verify. Returns False on any failure."""
    if not plain or not hashed:
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ---------- JWT ----------

def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    """Create a signed JWT. `subject` is typically the user id (str)."""
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=JWT_EXPIRE_MINUTES)).timestamp()),
    }
    if extra:
        # Don't allow callers to overwrite sub/iat/exp
        for k, v in extra.items():
            if k not in ("sub", "iat", "exp"):
                payload[k] = v
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode + verify signature. Raises HTTPException 401 on any failure."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ---------- FastAPI dependency ----------

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    """FastAPI dependency that returns the user id (str) from the JWT.

    Usage in router:
        @router.get("/me")
        def me(user_id: str = Depends(get_current_user_id)):
            ...
    """
    payload = decode_access_token(token)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject",
        )
    return str(sub)
