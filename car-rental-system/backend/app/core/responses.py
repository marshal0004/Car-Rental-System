"""
Shared API response helpers — consistent envelope across all 3 backends.

Envelope shape:
    { "success": true, "data": <payload>, "message": "..." }
or on error:
    { "success": false, "data": null, "message": "..." }
"""
from __future__ import annotations

from typing import Any

from fastapi.responses import JSONResponse


def ok(data: Any = None, message: str = "OK", status_code: int = 200) -> dict[str, Any]:
    return {"success": True, "data": data, "message": message}


def created(data: Any = None, message: str = "Created") -> dict[str, Any]:
    return {"success": True, "data": data, "message": message}


def fail(message: str, data: Any = None, status_code: int = 400) -> dict[str, Any]:
    return {"success": False, "data": data, "message": message}


def error_response(message: str, status_code: int = 400, data: Any = None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "data": data, "message": message},
    )
