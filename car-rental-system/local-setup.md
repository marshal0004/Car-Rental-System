# Local Setup Guide — 3 Full-Stack Projects

This guide walks you through setting up, running, and testing all three
projects locally in VS Code. Each project is fully self-contained —
you can run them independently or all at once.

## Projects at a glance

| Project | Backend port | Frontend port | DB file |
|---------|--------------|---------------|---------|
| Cafe Website (Brew & Bean Café) | 8001 | 3001 | `backend/data/cafe.db` |
| Online Examination System | 8002 | 3002 | `backend/data/exam.db` |
| Car Rental System (ZoomWheels) | 8003 | 3003 | `backend/data/car_rental.db` |

Each project follows the same structure:

```
<project>/
├── backend/         # FastAPI + SQLite + JWT (Python 3.12)
│   ├── app/         # Source code (routers, services, models, core)
│   ├── tests/       # pytest test suite (unit + functional + non-functional)
│   ├── data/        # SQLite DB file (auto-created on first run)
│   ├── requirements.txt
│   ├── pytest.ini
│   └── run.py       # Entry point: `python3 run.py`
├── frontend/        # Next.js 14 + React 18 + TypeScript + Tailwind
│   ├── src/         # App Router pages, components, lib, hooks
│   ├── src/__tests__/   # vitest unit tests
│   ├── e2e/         # Playwright E2E specs
│   ├── package.json
│   └── vitest.config.ts
├── prd.md           # Product requirements
├── plan.md          # Implementation plan
├── system-design.md # Architecture
├── architecture.md  # Component breakdown
└── mvptech.md       # MVP tech stack decisions
```

---

## Prerequisites

Install these once on your machine:

### 1. Python 3.12+

```bash
# macOS (Homebrew)
brew install python@3.12

# Ubuntu/Debian
sudo apt install python3.12 python3.12-venv

# Windows: download from https://python.org/downloads/
```

Verify:
```bash
python3 --version   # should print Python 3.12.x
```

### 2. Node.js 18+ and npm

```bash
# macOS (Homebrew)
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs

# Windows: download from https://nodejs.org/
```

Verify:
```bash
node --version   # should print v18.x or higher
npm --version    # should print 9.x or higher
```

### 3. VS Code (recommended editor)

Download from https://code.visualstudio.com/

Recommended extensions:
- **Python** (Microsoft) — Python language support
- **Pylance** (Microsoft) — Fast Python IntelliSense
- **ES7+ React/Redux/React-Native snippets** — React snippets
- **Tailwind CSS IntelliSense** — Tailwind class autocomplete
- **Playwright Test for VSCode** — Run E2E tests from VS Code

### 4. (Optional) Playwright Browsers

Only needed if you want to run E2E tests:
```bash
npx playwright install chromium
```

---

## Project 1: Cafe Website (Brew & Bean Café)

### Setup

```bash
# From the project root
cd projects/cafe-website/backend
python3 -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cd ../frontend
npm install
```

### Run

Open **two terminals** in VS Code (`Terminal → New Terminal`):

**Terminal 1 — backend:**
```bash
cd projects/cafe-website/backend
python3 run.py
# → Backend starts on http://localhost:8001
# → API docs at http://localhost:8001/docs
```

**Terminal 2 — frontend:**
```bash
cd projects/cafe-website/frontend
npm run dev
# → Frontend starts on http://localhost:3001
```

Open http://localhost:3001 in your browser.

### Test

```bash
# Backend tests (90 tests: unit + functional + non-functional)
cd projects/cafe-website/backend
python3 -m pytest -v

# Frontend unit tests (15 tests)
cd projects/cafe-website/frontend
npm test

# E2E tests (16 tests — requires backend + frontend running)
bash /home/z/my-project/scripts/run_e2e_tests.sh cafe
# OR manually: start both servers, then:
cd projects/cafe-website/frontend
npx playwright test --config=e2e/playwright.config.ts
```

---

## Project 2: Online Examination System

### Setup

```bash
cd projects/online-exam-system/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cd ../frontend
npm install
```

### Run

**Terminal 1 — backend:**
```bash
cd projects/online-exam-system/backend
python3 run.py
# → http://localhost:8002
```

**Terminal 2 — frontend:**
```bash
cd projects/online-exam-system/frontend
npm run dev
# → http://localhost:3002
```

### Test

```bash
# Backend tests (111 tests)
cd projects/online-exam-system/backend
python3 -m pytest -v

# Frontend unit tests (23 tests)
cd projects/online-exam-system/frontend
npm test

# E2E tests (15 tests)
bash /home/z/my-project/scripts/run_e2e_tests.sh exam
```

---

## Project 3: Car Rental System (ZoomWheels)

### Setup

```bash
cd projects/car-rental-system/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cd ../frontend
npm install
```

### Run

**Terminal 1 — backend:**
```bash
cd projects/car-rental-system/backend
python3 run.py
# → http://localhost:8003
```

**Terminal 2 — frontend:**
```bash
cd projects/car-rental-system/frontend
npm run dev
# → http://localhost:3003
```

### Test

```bash
# Backend tests (88 tests)
cd projects/car-rental-system/backend
python3 -m pytest -v

# Frontend unit tests (31 tests)
cd projects/car-rental-system/frontend
npm test

# E2E tests (20 tests)
bash /home/z/my-project/scripts/run_e2e_tests.sh car
```

---

## Running all 3 projects at once

You can run all 3 backends and all 3 frontends simultaneously — they
use different ports and separate SQLite databases.

Open **6 terminals** in VS Code (or use a terminal multiplexer like
`tmux`):

| Terminal | Command | URL |
|----------|---------|-----|
| 1 | `cd projects/cafe-website/backend && python3 run.py` | http://localhost:8001 |
| 2 | `cd projects/cafe-website/frontend && npm run dev` | http://localhost:3001 |
| 3 | `cd projects/online-exam-system/backend && python3 run.py` | http://localhost:8002 |
| 4 | `cd projects/online-exam-system/frontend && npm run dev` | http://localhost:3002 |
| 5 | `cd projects/car-rental-system/backend && python3 run.py` | http://localhost:8003 |
| 6 | `cd projects/car-rental-system/frontend && npm run dev` | http://localhost:3003 |

**Tip:** VS Code's split-terminal feature (`Cmd+\` / `Ctrl+\`) lets
you see multiple terminals side-by-side in one panel.

---

## Test suite overview

Each project has **4 layers of tests**:

### 1. Backend unit tests (`tests/test_unit.py`)
Pure-function tests with no I/O — fast, isolated, deterministic.
- Password hashing (bcrypt)
- JWT issuance / verification
- Pydantic model validation
- Service-layer pure functions (e.g., `compute_score`, `days_between`)

### 2. Backend functional system tests (`tests/test_system_functional.py`)
Full HTTP-stack tests through FastAPI's TestClient — exercise the
real API contract documented in each project's PRD.
- API envelope shape (`{success, data, message}`)
- Full user flows (register → login → create → list → cancel)
- Validation rejects bad input cleanly
- Cross-user isolation (User A cannot read User B's data)

### 3. Backend non-functional system tests (`tests/test_system_nonfunctional.py`)
Covers the *-ilities* that matter for production:
- **Performance:** response-time budgets, concurrent readers
- **Security:** auth bypass, SQL injection, CORS, password leak
- **Reliability:** malformed inputs, large payloads, wrong content-types
- **HTTP compatibility:** status codes, headers, OpenAPI schema

### 4. Frontend unit tests (`src/__tests__/`)
Vitest + React Testing Library:
- Pure utility functions (formatting, pricing, auth storage)
- Component rendering (MenuCard, ExamCard, CarCard)

### 5. E2E tests (`e2e/*.spec.ts`)
Playwright browser tests covering the full user journey:
- **home.spec.ts** — homepage loads, sections render, navigation works
- **auth.spec.ts** — register, login, protected-route redirects
- **responsive.spec.ts** — viewport testing (mobile 375px, tablet 768px, desktop 1280px)

### Test counts (as of last verification)

| Project | Backend pytest | Frontend vitest | Playwright E2E | Total |
|---------|---------------|-----------------|----------------|-------|
| Cafe | 90 | 15 | 16 | **121** |
| Exam | 111 | 23 | 15 | **149** |
| Car | 88 | 31 | 20 | **139** |
| **Total** | **289** | **69** | **51** | **409** |

---

## Re-verifying everything (smoke tests)

Quick backend-only smoke tests (curl-based, ~5s each):

```bash
bash /home/z/my-project/scripts/smoke_test_cafe.sh
bash /home/z/my-project/scripts/smoke_test_exam.sh
bash /home/z/my-project/scripts/smoke_test_car.sh
```

Full integration tests (backend + frontend, ~60s each):

```bash
bash /home/z/my-project/scripts/integration_test.sh cafe
bash /home/z/my-project/scripts/integration_test.sh exam
bash /home/z/my-project/scripts/integration_test.sh car
```

---

## Troubleshooting

### "Port already in use"

Kill any orphan processes from a previous run:

```bash
# Find what's using a port
lsof -i :8001   # macOS/Linux
netstat -ano | findstr :8001   # Windows

# Kill by port (macOS/Linux)
kill -9 $(lsof -t -i:8001)

# Or kill all our backend / frontend processes at once
pkill -f "uvicorn.*800[1-3]"
pkill -f "next dev.*300[1-3]"
```

### "Database is locked" / stale data

Delete the SQLite file and restart — the backend re-creates and
re-seeds it automatically:

```bash
rm projects/cafe-website/backend/data/cafe.db
rm projects/online-exam-system/backend/data/exam.db
rm projects/car-rental-system/backend/data/car_rental.db
```

### "Module not found" after pulling updates

```bash
# Backend
cd projects/<project>/backend
pip install -r requirements.txt --upgrade

# Frontend
cd projects/<project>/frontend
rm -rf node_modules package-lock.json
npm install
```

### Frontend can't reach backend

The frontend talks to the backend at the URL defined in
`NEXT_PUBLIC_API_BASE` (default: `http://localhost:800X/api`). If you
changed the backend port, set the env var before starting the frontend:

```bash
# Example: cafe frontend talking to a non-default backend port
NEXT_PUBLIC_API_BASE=http://localhost:9001/api npm run dev
```

### Playwright browser not installed

```bash
cd projects/<project>/frontend
npx playwright install chromium
```

### Pytest not found

```bash
pip install pytest httpx
# OR if using a venv:
source .venv/bin/activate
pip install pytest httpx
```

---

## Production deployment notes

These projects are configured for **local development**. Before
deploying to production:

1. **JWT secret** — set a long random `JWT_SECRET` env var (each backend
   reads it on startup). The default dev secret rotates per process,
   which logs everyone out on every restart.

2. **CORS** — currently allows all origins (`allow_origins=["*"]`).
   In production, restrict to your real frontend domain.

3. **SQLite** — fine for low-traffic sites (hundreds of users). For
   higher traffic, switch to PostgreSQL by changing the `DB_PATH` /
   connection string in `app/core/config.py` and updating
   `app/core/db.py` to use `asyncpg` instead of `aiosqlite`.

4. **HTTPS** — terminate TLS at a reverse proxy (nginx, Caddy, or your
   cloud provider's load balancer). Don't run uvicorn directly on the
   internet.

5. **Static assets** — the frontend ships with SVG placeholders for
   food / car / gallery images. Drop real `.webp` images into
   `frontend/public/images/` to replace them.

---

## File-by-file map (for code review)

### Backend (each project)

| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI app factory, CORS, exception handlers, router registration |
| `app/core/config.py` | Env-var-driven settings (DB path, JWT secret, port) |
| `app/core/db.py` | aiosqlite connection helpers (`get_db`, `db_transaction`, `fetch_all`, `fetch_one`) |
| `app/core/security.py` | bcrypt hashing, JWT encode/decode, `get_current_user_id` dependency |
| `app/core/responses.py` | `ok()`, `created()`, `error_response()` envelope helpers |
| `app/models/*.py` | Pydantic v2 schemas (request/response shapes) |
| `app/services/*.py` | Business logic (DB queries, validation, side effects) |
| `app/routers/*.py` | FastAPI route handlers (one file per feature area) |
| `app/schemas/__init__.py` | SQLite DDL (`CREATE TABLE IF NOT EXISTS ...`) |
| `tests/conftest.py` | Shared pytest fixtures (TestClient, auth helpers, fresh DB) |
| `tests/test_unit.py` | Pure-function unit tests |
| `tests/test_smoke.py` | Basic smoke tests (legacy, kept for reference) |
| `tests/test_system_functional.py` | API contract / user-flow tests |
| `tests/test_system_nonfunctional.py` | Performance, security, reliability tests |
| `pytest.ini` | Pytest config (markers, asyncio mode, output format) |
| `run.py` | Entry point — `python3 run.py` starts uvicorn |

### Frontend (each project)

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout (fonts, providers, Navbar, Footer) |
| `src/app/page.tsx` | Homepage |
| `src/app/login/page.tsx` | Login form (react-hook-form + zod) |
| `src/app/register/page.tsx` | Registration form |
| `src/app/<feature>/page.tsx` | Feature pages (menu, exams, cars, bookings, etc.) |
| `src/components/*.tsx` | Reusable UI components (cards, forms, sections) |
| `src/lib/api.ts` | Backend API client + auth-token storage |
| `src/lib/types.ts` | TypeScript types matching backend models |
| `src/lib/utils.ts` / `pricing.ts` | Pure utility functions |
| `src/hooks/useAuth.ts` | Auth state hook (registers, logs in, tracks user) |
| `src/components/AuthContext.tsx` | React context provider for auth state |
| `src/__tests__/setup.ts` | Vitest setup (jest-dom matchers, mocks) |
| `src/__tests__/*.test.ts(x)` | Unit tests (utilities + components) |
| `e2e/playwright.config.ts` | Playwright config (baseURL, browser, reporter) |
| `e2e/home.spec.ts` | Homepage E2E tests |
| `e2e/auth.spec.ts` | Auth flow E2E tests |
| `e2e/responsive.spec.ts` | Viewport / responsive design E2E tests |
| `vitest.config.ts` | Vitest config (jsdom, path aliases, coverage) |

---

## Need help?

- Each project's `prd.md` describes what the project does
- `system-design.md` explains the architecture
- `architecture.md` breaks down the component structure
- `mvptech.md` documents the tech-stack decisions
- Backend API docs: visit `http://localhost:800X/docs` while the backend is running
