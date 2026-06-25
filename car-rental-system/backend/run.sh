#!/usr/bin/env bash
# Car Rental Management System — backend launcher.
# Binds to 0.0.0.0:8003 with --reload for dev.
set -euo pipefail

cd "$(dirname "$0")"

PORT=8003
HOST=0.0.0.0

# Use python -m uvicorn so we resolve from the backend dir correctly.
exec python -m uvicorn app.main:app --host "$HOST" --port "$PORT" --reload
