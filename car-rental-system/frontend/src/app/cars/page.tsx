'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, SearchX } from 'lucide-react';
import type { CarFilters, CarSummary } from '@/lib/types';
import { fetchCars } from '@/lib/api';
import {
  filtersToQueryString,
  parseFiltersFromSearchParams,
  removeFilter,
} from '@/lib/filters';
import FilterBar from '@/components/FilterBar';
import FilterChips from '@/components/FilterChips';
import CarCard from '@/components/CarCard';

export default function CarsPage() {
  return (
    <Suspense fallback={<CarsPageFallback />}>
      <CarsPageContent />
    </Suspense>
  );
}

function CarsPageFallback() {
  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="container py-8">
          <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            Browse Our Fleet
          </h1>
          <p className="mt-2 text-base text-slate-600">Loading filters…</p>
        </div>
      </section>
      <div className="container py-8">
        <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

function CarsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive filter state from URL on every render — single source of truth.
  const filters = useMemo(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams],
  );

  const [cars, setCars] = useState<CarSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cars whenever the URL changes.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchCars(filters)
      .then((data) => {
        if (active) setCars(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Failed to load cars.',
          );
          setCars([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters]);

  // Update URL when filters change. We use `router.replace` so the back button
  // still works naturally and the URL stays shareable.
  const updateFilters = useCallback(
    (next: CarFilters) => {
      const qs = filtersToQueryString(next);
      router.replace(`${pathname}${qs}`, { scroll: false });
    },
    [pathname, router],
  );

  const handleRemoveChip = useCallback(
    (key: keyof CarFilters) => {
      const next = removeFilter(filters, key);
      updateFilters(next);
    },
    [filters, updateFilters],
  );

  const handleClear = useCallback(() => {
    router.replace(`${pathname}`, { scroll: false });
  }, [pathname, router]);

  return (
    <div className="bg-slate-50">
      {/* Page header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container py-8">
          <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
            <ol className="flex items-center gap-1">
              <li>
                <Link href="/" className="hover:text-brand-700">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-slate-700">Cars</li>
            </ol>
          </nav>
          <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            Browse Our Fleet
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-600">
            Filter by category, fuel, price, and seating to find the perfect
            car. All prices include taxes.
          </p>
        </div>
      </section>

      <div className="container py-8">
        <div className="space-y-5">
          <FilterBar
            filters={filters}
            onChange={updateFilters}
            onClear={handleClear}
            resultCount={cars.length}
            loading={loading}
          />

          <FilterChips filters={filters} onRemove={handleRemoveChip} />

          {error ? (
            <div className="rounded-lg border border-danger/30 bg-danger/10 p-6 text-sm text-danger">
              {error}
            </div>
          ) : loading ? (
            <CarGridSkeleton />
          ) : cars.length === 0 ? (
            <EmptyState onClear={handleClear} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}

          {!loading && cars.length > 0 && (
            <p className="text-center text-xs text-slate-500">
              Showing {cars.length} car{cars.length === 1 ? '' : 's'} &middot;{' '}
              <Link href="/cars" className="text-brand-700 hover:underline">
                Reset filters
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CarGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <SearchX className="mx-auto h-12 w-12 text-slate-400" aria-hidden="true" />
      <h2 className="mt-4 font-display text-xl font-semibold text-slate-900">
        No cars match your filters
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Try widening your price range or removing a category filter.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Clear all filters
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
