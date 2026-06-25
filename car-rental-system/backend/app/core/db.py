"""
Shared SQLite async helpers.

Pattern: each backend keeps its SQLite file at backend/data/<project>.db
and uses aiosqlite for async DB access. We use a tiny connection-pool-like
helper rather than raw open/close on every call to keep latency low.

Each backend copies this file to its own backend/app/core/db.py.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import aiosqlite


# Resolved at import time of the backend (each backend sets DB_PATH before importing)
DB_PATH: str = ""  # backend overrides via env or direct assignment


def set_db_path(path: str) -> None:
    global DB_PATH
    DB_PATH = path
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)


async def get_db() -> aiosqlite.Connection:
    """Returns a connection. Caller is responsible for closing it OR use
    `db_transaction` below.

    FastAPI usage:
        async def endpoint(db: aiosqlite.Connection = Depends(get_db)):
            ...
    """
    if not DB_PATH:
        raise RuntimeError("DB_PATH not set. Call set_db_path() at startup.")
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        await db.execute("PRAGMA foreign_keys = ON")
        await db.execute("PRAGMA journal_mode = WAL")
    except Exception:
        pass
    return db


async def close_db(db: aiosqlite.Connection) -> None:
    try:
        await db.commit()
    except Exception:
        pass
    await db.close()


@asynccontextmanager
async def db_transaction():
    """Context manager that yields a connection and commits/closes it.

    Usage:
        async with db_transaction() as db:
            await db.execute("INSERT INTO ...")
    """
    db = await get_db()
    try:
        yield db
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    finally:
        await db.close()


async def execute(sql: str, params: tuple[Any, ...] = ()) -> int:
    """Execute a write query. Returns lastrowid."""
    async with db_transaction() as db:
        cur = await db.execute(sql, params)
        await db.commit()
        return cur.lastrowid or 0


async def fetch_all(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    async with db_transaction() as db:
        cur = await db.execute(sql, params)
        rows = await cur.fetchall()
        return [dict(r) for r in rows]


async def fetch_one(sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    async with db_transaction() as db:
        cur = await db.execute(sql, params)
        row = await cur.fetchone()
        return dict(row) if row else None


async def init_schema(schema_sql: str) -> None:
    """Run schema DDL on startup. Idempotent (uses CREATE TABLE IF NOT EXISTS)."""
    async with db_transaction() as db:
        await db.executescript(schema_sql)
        await db.commit()
