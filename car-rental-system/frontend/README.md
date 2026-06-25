# ZoomWheels — Car Rental Frontend

A production-grade Next.js 14 frontend for the ZoomWheels car rental system.
Built with the App Router, TypeScript, Tailwind CSS, React Hook Form + Zod, and
`lucide-react`. The frontend talks to the FastAPI backend on port **8003**.

- **Port:** `3003`
- **Backend URL:** `http://localhost:8003/api` (must be running)
- **Stack:** Next.js 14 · React 18 · TypeScript · Tailwind 3.4 · lucide-react · react-hook-form · zod

---

## Quick start

```bash
cd /home/z/my-project/projects/car-rental-system/frontend

# install dependencies
npm install

# start the dev server (port 3003)
npm run dev
# → http://localhost:3003
```

Make sure the backend is running on port **8003** before launching the frontend:

```bash
cd /home/z/my-project/projects/car-rental-system/backend
python3 run.py
```

### Production build

```bash
npm run build
npm run start   # serves the production build on port 3003
```

---

## Environment variables

| Variable              | Default                              | Description                              |
|-----------------------|--------------------------------------|------------------------------------------|
| `NEXT_PUBLIC_API_BASE`| `http://localhost:8003/api`          | Base URL of the backend API.             |

Override by creating a `.env.local` file:

```
NEXT_PUBLIC_API_BASE=http://localhost:8003/api
```

---

## Pages

| Route                  | Description                                                |
|------------------------|------------------------------------------------------------|
| `/`                    | Homepage: hero, intro, featured cars, categories, how-it-works. |
| `/cars`                | Fleet listing with URL-synced filters + sort.              |
| `/cars/[carId]`        | Car detail: image gallery, specs, features, similar cars.  |
| `/book?carId=<id>`     | Booking form (auth required). Live cost estimate.          |
| `/my-bookings`         | List user's bookings (auth required) + cancel.             |
| `/login`               | Login form. Redirects back via `?redirect=` query.         |
| `/register`            | Registration form.                                         |

---

## Auth flow

- On login/register, the backend returns `{ user, token }` (Bearer JWT, 7-day
  expiry).
- Token + user object are persisted in `localStorage` under keys
  `car_token` and `car_user` respectively.
- Every authenticated API request attaches `Authorization: Bearer <token>`.
- `AuthProvider` (in `src/components/AuthContext.tsx`) hydrates state on mount
  and exposes `{ user, login, register, logout, isAuthenticated }` via
  `useAuth()`.
- Routes that require auth (`/book`, `/my-bookings`) redirect to
  `/login?redirect=<original-path>` if no token is present.

---

## URL-synced filters (deep-linkable)

The `/cars` page stores every filter in the URL query string — so filters are
**shareable, deep-linkable, and survive refresh**.

Supported params:

| Param             | Example              | Notes                                              |
|-------------------|----------------------|----------------------------------------------------|
| `search`          | `?search=swift`      | Text search (debounced 300 ms in the UI).          |
| `category`        | `?category=suv`      | One of `hatchback\|sedan\|suv\|luxury`.            |
| `fuel_type`       | `?fuel_type=diesel`  | One of `petrol\|diesel\|electric\|cng`.            |
| `min_price`       | `?min_price=2000`    | Inclusive lower bound, ₹/day.                      |
| `max_price`       | `?max_price=5000`    | Inclusive upper bound, ₹/day.                      |
| `min_seating`     | `?min_seating=5`     | Minimum seating capacity.                          |
| `available_only`  | `?available_only=true` | Boolean flag.                                    |
| `sort`            | `?sort=price_asc`    | `price_asc\|price_desc\|name_asc\|newest`.         |

Examples:
- `/cars?category=suv&sort=price_desc`
- `/cars?fuel_type=diesel&min_seating=7&available_only=true`

Active filters appear as removable chips below the filter bar. Clicking the X
on a chip removes that single filter from the URL.

The pure helpers that convert between filter state and URL strings live in
`src/lib/filters.ts` — they are decoupled from React and fully unit-testable.

---

## Folder structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Navbar + Footer + AuthProvider
│   │   ├── page.tsx            # Home
│   │   ├── globals.css
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── cars/
│   │   │   ├── page.tsx        # Listing — URL-synced filters
│   │   │   └── [carId]/page.tsx
│   │   ├── book/page.tsx       # Booking form
│   │   └── my-bookings/page.tsx
│   ├── components/
│   │   ├── AuthContext.tsx
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── CarCard.tsx
│   │   ├── FilterBar.tsx
│   │   ├── FilterChips.tsx
│   │   ├── ImageGallery.tsx
│   │   ├── BookingForm.tsx     # RHF + Zod + live cost estimate
│   │   └── BookingList.tsx     # List with cancel buttons
│   ├── lib/
│   │   ├── api.ts              # Fetch wrapper + token storage
│   │   ├── types.ts            # Car/Booking/User types
│   │   ├── filters.ts          # Pure URL <-> filter helpers
│   │   └── pricing.ts          # daysBetween + computeTotalCost
│   └── hooks/
│       └── useAuth.ts          # Re-export of AuthContext hook
├── public/
│   └── images/
│       ├── hero.svg
│       └── cars/placeholder.svg
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── postcss.config.js
```

---

## Key features

1. **URL-synced filters** — `/cars` reads every filter from `useSearchParams()`
   and pushes changes back via `router.replace()`. Filters survive refresh and
   are shareable.
2. **Live cost estimate** on the booking form — recomputes via `useMemo`
   whenever the selected car or dates change. Uses the pure
   `daysBetween` / `computeTotalCost` functions in `src/lib/pricing.ts`.
3. **Native `<input type="date">`** for mobile UX (no calendar dependency).
4. **Auth gate** — `/book` and `/my-bookings` redirect to
   `/login?redirect=<path>` if no token is present.
5. **Cancel booking** with optimistic refetch — the booking list refreshes
   immediately after a successful DELETE.
6. **Booking success view** — shows the booking reference, total cost, and
   links to "View My Bookings" or "Browse More Cars".
7. **Accessibility** — semantic HTML, ARIA labels on filter chips, `aria-live`
   for form errors, skip-to-content link, keyboard-navigable focus rings,
   mobile hamburger menu.

---

## Notes & caveats

- **Images are placeholders.** The backend returns image paths like
  `/images/cars/maruti-swift-1.webp`, but those files don't physically exist on
  the frontend. Every `<img>` tag has an `onError` handler that swaps to
  `/images/cars/placeholder.svg` so the UI degrades gracefully. Drop real
  images into `public/images/cars/` to replace the placeholders.
- **No dark mode** (`next-themes`) and **no Framer Motion** — kept the
  dependency footprint small per project requirements. Subtle CSS transitions
  (`card-lift`, hover states) provide visual feedback.
- **CORS is wide-open** on the backend (`allow_origins=["*"]`) so the frontend
  on port 3003 can call the backend on port 8003 without proxy config.
- **Single access token, 7-day expiry.** No refresh tokens — re-login when it
  expires.

---

*End of README — ZoomWheels frontend*
