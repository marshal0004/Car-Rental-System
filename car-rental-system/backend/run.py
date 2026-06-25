#!/usr/bin/env python
"""Car Rental backend — direct python entrypoint.

Usage:
    python run.py
Binds to 0.0.0.0:8003 with reload enabled.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Make sure the backend/ directory is on sys.path so `import app.main` works.
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

import uvicorn  # noqa: E402

from app.core.config import HOST, PORT  # noqa: E402


def main() -> None:
    uvicorn.run(
        "app.main:app",
        host=HOST,
        port=PORT,
        reload=True,
        reload_dirs=[str(BACKEND_DIR)],
    )


if __name__ == "__main__":
    main()
