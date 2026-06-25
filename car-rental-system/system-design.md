# System Design Document
## Project: Car Rental Management System (Task 3)

**Document Version:** 1.0
**Last Updated:** 2026-06-24
**Scope:** Frontend-only static web application (MVP) with `localStorage` persistence

---

## 1. System Context

The Car Rental Management System is a fully client-side web application with no runtime backend dependencies for the MVP. The only external integrations are:

1. **CDN host (Vercel/Netlify)** — for static asset delivery.
2. **(Future) Auth provider** — for Phase 2 user accounts.
3. **(Future) Backend API** — for server-side booking persistence and inventory.

```
                  ┌─────────────────────┐
                  │    End User         │
                  │   (Browser)         │
                  └──────────┬──────────┘
                             │ HTTPS
                             ▼
            ┌──────────────────────────────────┐
            │  Vercel CDN (static hosting)     │
            │  - HTML pages                    │
            │  - JS chunks (hashed)            │
            │  - CSS                           │
            │  - Car catalog (in JS bundle)    │
            │  - Car images (WebP)             │
            └──────────────────────────────────┘
                             │
                             │ All filtering & booking logic client-side
                             ▼
            ┌──────────────────────────────────┐
            │  Browser localStorage            │
            │  - crms:bookings (history)       │
            │  - crms:user (optional)          │
            │  - crms:theme                    │
            └──────────────────────────────────┘
```

---

## 2. Module Decomposition

### 2.1 Module Map

```
car-rental-system/
│
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # Root: Navbar + Footer + ThemeProvider
│   ├── page.tsx                    # Home
│   ├── cars/
│   │   ├── page.tsx                # Listing + filters
│   │   └── [id]/page.tsx           # Car detail
│   ├── book/page.tsx               # Booking form (reads ?carId=)
│   ├── my-bookings/page.tsx        # Past bookings
│   └── login/page.tsx              # Bonus: mock login
│
├── components/
│   ├── layout/                     # Navbar, Footer
│   ├── home/                       # Hero, Intro, FeaturedCars, Categories, HowItWorks
│   ├── cars/                       # CarCard, CarGrid, FilterBar, FilterChip, SortDropdown
│   ├── detail/                     # CarGallery, CarSpecs, PriceBreakdown, FeaturesList
│   ├── booking/                    # BookingForm, CostEstimate, SuccessMessage
│   ├── my-bookings/                # BookingList
│   └── ui/                         # Button, Container, Card, Modal, Input
│
├── lib/
│   ├── types.ts                    # Car, Booking, FilterState types
│   ├── filters.ts                  # applyFilters pure function
│   ├── pricing.ts                  # computeTotalCost pure function
│   ├── storage.ts                  # SSR-safe localStorage helpers
│   ├── urlState.ts                 # parse/serialize filter state to URL
│   ├── booking.ts                  # generateBookingId, saveBooking, etc.
│   └── utils.ts                    # cn(), formatDate, formatPrice
│
├── data/
│   └── cars.ts                     # Static car catalog
│
└── public/
    ├── images/
    │   ├── cars/
    │   └── hero/
    └── icons/
```

### 2.2 Module Responsibilities

| Module | Responsibility | Depends On |
|--------|----------------|------------|
| `app/layout.tsx` | Mount global chrome and providers | Navbar, Footer, ThemeProvider |
| `app/page.tsx` | Render homepage sections | `home/*` components, `data/cars.ts` |
| `app/cars/page.tsx` | List + filter cars | `cars/*` components, `lib/filters`, `lib/urlState` |
| `app/cars/[id]/page.tsx` | Show car detail | `detail/*` components, `data/cars.ts` |
| `app/book/page.tsx` | Booking form | `booking/*` components, `lib/booking`, `lib/storage` |
| `app/my-bookings/page.tsx` | List past bookings | `my-bookings/*` components, `lib/storage` |
| `lib/filters.ts` | Pure filtering function | `lib/types` |
| `lib/pricing.ts` | Pure pricing function | — |
| `lib/storage.ts` | localStorage abstraction | — |
| `lib/urlState.ts` | Filter ↔ URL sync | `lib/types` |
| `lib/booking.ts` | Booking ID + save + cancel | `lib/storage`, `lib/types` |

---

## 3. Detailed Component Design

### 3.1 FilterBar — URL-Synced Filters

The filter state lives in URL search params, not just React state. This makes filters deep-linkable, shareable, and survives navigation.

**`lib/urlState.ts`:**
```ts
import { FilterState } from "./types";

export function parseFilters(sp: URLSearchParams): FilterState {
  return {
    search: sp.get("q") ?? "",
    category: (sp.get("cat") as FilterState["category"]) ?? "all",
    fuelType: (sp.get("fuel") as FilterState["fuelType"]) ?? "all",
    minPrice: Number(sp.get("min") ?? 0),
    maxPrice: Number(sp.get("max") ?? 100000),
    seating: sp.get("seat") ? Number(sp.get("seat")) : "all",
    sort: (sp.get("sort") as FilterState["sort"]) ?? "default",
    availableOnly: sp.get("avail") === "1",
  };
}

export function serializeFilters(state: FilterState): URLSearchParams {
  const sp = new URLSearchParams();
  if (state.search) sp.set("q", state.search);
  if (state.category !== "all") sp.set("cat", state.category);
  if (state.fuelType !== "all") sp.set("fuel", state.fuelType);
  if (state.minPrice > 0) sp.set("min", String(state.minPrice));
  if (state.maxPrice < 100000) sp.set("max", String(state.maxPrice));
  if (state.seating !== "all") sp.set("seat", String(state.seating));
  if (state.sort !== "default") sp.set("sort", state.sort);
  if (state.availableOnly) sp.set("avail", "1");
  return sp;
}
```

**`app/cars/page.tsx` (simplified):**
```tsx
"use client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function CarsPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = useMemo(() => parseFilters(sp), [sp]);
  const filteredCars = useMemo(() => applyFilters(cars, filters), [filters]);

  const updateFilters = (next: Partial<FilterState>) => {
    const merged = { ...filters, ...next };
    const newSp = serializeFilters(merged);
    router.replace(`${pathname}?${newSp.toString()}`, { scroll: false });
  };

  return (
    <>
      <FilterBar filters={filters} onChange={updateFilters} />
      <ActiveFilterChips filters={filters} onRemove={updateFilters} />
      <CarGrid cars={filteredCars} />
    </>
  );
}
```

---

### 3.2 applyFilters — Pure Function

**`lib/filters.ts`:**
```ts
import { Car, FilterState } from "./types";

export function applyFilters(cars: Car[], f: FilterState): Car[] {
  let result = cars.filter((c) => {
    if (f.search && !c.name.toLowerCase().includes(f.search.toLowerCase()) &&
        !c.model.toLowerCase().includes(f.search.toLowerCase())) return false;
    if (f.category !== "all" && c.category !== f.category) return false;
    if (f.fuelType !== "all" && c.fuelType !== f.fuelType) return false;
    if (c.pricePerDay < f.minPrice || c.pricePerDay > f.maxPrice) return false;
    if (f.seating !== "all" && c.seatingCapacity < (f.seating as number)) return false;
    if (f.availableOnly && !c.isAvailable) return false;
    return true;
  });

  switch (f.sort) {
    case "price-asc": result = [...result].sort((a, b) => a.pricePerDay - b.pricePerDay); break;
    case "price-desc": result = [...result].sort((a, b) => b.pricePerDay - a.pricePerDay); break;
  }
  return result;
}
```

Pure function — fully unit-testable.

---

### 3.3 BookingForm — React Hook Form + Zod + Live Cost

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema } from "@/lib/booking";

export function BookingForm({ preselectedCarId }: { preselectedCarId?: string }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: { carId: preselectedCarId ?? "" },
  });

  const carId = watch("carId");
  const pickupDate = watch("pickupDate");
  const returnDate = watch("returnDate");
  const selectedCar = cars.find((c) => c.id === carId);
  const totalCost = useMemo(() => computeTotalCost(selectedCar?.pricePerDay ?? 0, pickupDate, returnDate), [selectedCar, pickupDate, returnDate]);

  const onSubmit = async (data: BookingFormData) => {
    const booking: Booking = {
      id: generateBookingId(),
      carId: data.carId,
      carName: cars.find((c) => c.id === data.carId)?.name ?? "",
      customerName: data.customerName,
      email: data.email,
      phone: data.phone,
      pickupDate: data.pickupDate,
      returnDate: data.returnDate,
      pickupAddress: data.pickupAddress,
      specialRequests: data.specialRequests,
      totalDays: daysBetween(data.pickupDate, data.returnDate),
      totalCost,
      status: "pending",
      createdAt: Date.now(),
    };
    saveBooking(booking);
    // show success state
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* form fields with register() and error display */}
      <CostEstimate car={selectedCar} totalCost={totalCost} days={daysBetween(pickupDate, returnDate)} />
      <Button type="submit" disabled={isSubmitting}>Confirm Booking</Button>
    </form>
  );
}
```

---

### 3.4 CarGallery

- Main image: large `<img>` or `next/image` (fill mode).
- Thumbnail strip: row of small clickable images below.
- State: `const [activeIndex, setActiveIndex] = useState(0)`.
- Clicking thumbnail updates `activeIndex`.
- Optional: lightbox modal on main image click (bonus).

---

### 3.5 BookingList

- Reads `crms:bookings` from `localStorage` on mount.
- Renders each booking as a card with:
  - Booking reference (e.g., "BK-2026-A7X9")
  - Car name
  - Pickup date → Return date
  - Total days × price/day = total cost
  - Status badge (Pending)
  - "Cancel" button
- Cancel: shows confirmation dialog → on confirm, removes from `localStorage` and re-renders.
- Empty state: "You have no bookings yet" with "Browse Cars" CTA.

---

## 4. Data Design

### 4.1 Static Car Catalog

Static TypeScript file `data/cars.ts`. Exported as `cars: Car[]`.

**Constraints enforced via CI test:**
- Each car has ≥1 image.
- `pricePerDay` is a positive integer.
- `seatingCapacity` is in `[2, 9]`.
- `category` is one of the 4 allowed values.
- `fuelType` is one of the 4 allowed values.

### 4.2 LocalStorage Schema

| Key | Shape | Lifetime |
|-----|-------|----------|
| `crms:bookings` | `Booking[]` (capped at 50, oldest trimmed) | Permanent (until user clears) |
| `crms:user` | `{ name, email, createdAt }` (bonus) | Permanent |
| `crms:theme` | `"light" \| "dark" \| "system"` | Permanent |

### 4.3 Storage Helpers (`lib/storage.ts`)

```ts
export function getLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage write failed", e);
  }
}

export function removeLocalStorage(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}
```

### 4.4 Pricing (`lib/pricing.ts`)

```ts
export function daysBetween(pickup: string, returnDate: string): number {
  if (!pickup || !returnDate) return 0;
  const p = new Date(pickup).getTime();
  const r = new Date(returnDate).getTime();
  if (isNaN(p) || isNaN(r) || r <= p) return 0;
  return Math.ceil((r - p) / (1000 * 60 * 60 * 24));
}

export function computeTotalCost(pricePerDay: number, pickup: string, returnDate: string): number {
  return pricePerDay * daysBetween(pickup, returnDate);
}
```

Pure functions — fully unit-testable.

---

## 5. State Management

| State | Scope | Mechanism | Persisted? |
|-------|-------|-----------|------------|
| Filter state on `/cars` | Page-wide | URL search params + `useState` | ✅ In URL |
| Booking form | Form local | React Hook Form | ❌ (saved on submit) |
| Past bookings | App-wide | Read from `localStorage` on demand | ✅ localStorage |
| Theme | App-wide | `next-themes` | ✅ localStorage |
| User profile (bonus) | App-wide | Read on demand | ✅ localStorage |
| Gallery active index | Detail page local | `useState` | ❌ |

No global state library needed.

---

## 6. Routing Design

| Route | Render Type | Notes |
|-------|-------------|-------|
| `/` | Static | Homepage |
| `/cars` | Client-only (`"use client"`) | Dynamic filtering; reads URL params |
| `/cars/[id]` | Static (with `generateStaticParams`) | Pre-renders all car detail pages |
| `/book` | Client-only | Reads `?carId=` from query |
| `/my-bookings` | Client-only | Reads from `localStorage` |
| `/login` | Client-only | Bonus |

---

## 7. Caching Strategy

| Asset | Cache Policy |
|-------|--------------|
| HTML | `Cache-Control: public, max-age=0, must-revalidate` |
| JS/CSS (hashed) | `Cache-Control: public, max-age=31536000, immutable` |
| Car catalog (in JS bundle) | Cached as part of JS chunks |
| Car images (WebP) | `Cache-Control: public, max-age=31536000, immutable` |
| Fonts | Self-hosted, immutable |

---

## 8. Error Handling

| Scenario | Handling |
|----------|----------|
| Car ID in URL doesn't exist | Show 404 page with "Back to cars" link |
| Booking form: car not selected | Inline error "Please select a car" |
| Booking form: return date before pickup | Inline error on returnDate field |
| localStorage quota exceeded | Catch in `setLocalStorage`; show toast "Could not save booking; please clear old bookings." |
| Corrupted bookings array (bad JSON) | `getLocalStorage` returns fallback `[]`; user sees empty state |

---

## 9. Testing Strategy

| Layer | Tooling | Coverage Target |
|-------|---------|----------------|
| Unit (logic) | Vitest | `filters.ts`, `pricing.ts`, `urlState.ts`, `booking.ts` |
| Component | React Testing Library | `BookingForm`, `FilterBar`, `CarCard`, `BookingList` |
| E2E | Playwright | Full flow: home → cars → filter → detail → book → my-bookings → cancel |
| Accessibility | `@axe-core/playwright` | 0 critical violations |
| Performance | Lighthouse CI | ≥80 mobile / ≥85 desktop |

---

## 10. Build & Deploy Pipeline

```
git push origin main
   │
   ▼
GitHub triggers Vercel webhook
   │
   ▼
Vercel build:
   1. npm ci
   2. npm run lint
   3. npm run test (Vitest)
   4. npm run build  (next build → static export)
   5. Output: out/ directory
   │
   ▼
Deploy to global edge network
   │
   ▼
Preview URL (per PR) + Production URL (on main)
```

---

## 11. Observability

For the MVP:
- **Vercel Web Analytics** — privacy-friendly pageview metrics.
- **Lighthouse CI** in GitHub Actions — fails PR if score drops below threshold.
- **Error tracking** — Sentry (optional, free tier) for client-side exceptions.

---

## 12. Design Decisions & Trade-offs

| Decision | Choice | Trade-off |
|----------|--------|-----------|
| Backend | None (frontend-only MVP) | ✔ Ships fast, zero infra; ✗ No server-side persistence, no real inventory |
| Car catalog | Static TS file | ✔ Instant load, no fetch; ✗ Owner can't edit live |
| Filter state | URL search params | ✔ Deep-linkable, shareable; ✗ Slightly more code than `useState` |
| Persistence | localStorage | ✔ No backend; ✗ Per-device only, lost if user clears data |
| Date picker | Native `<input type="date">` | ✔ Best mobile UX, no dependency; ✗ Less customizable than a calendar lib |
| Booking ID | `Math.random()` suffix | ✔ Simple, no counter needed; ✗ Tiny collision risk (acceptable for MVP volume) |
| Pricing | Per-day only | ✔ Simple; ✗ No weekly/monthly discounts in calculation (shown as info only) |
| Routing | Next.js App Router (static export) | ✔ SEO-friendly detail pages; ✗ Listing/book pages can't be pre-rendered (client-only) |

---

*End of System Design Document — Car Rental Management System (Task 3)*
