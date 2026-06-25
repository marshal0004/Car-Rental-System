'use client';

import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { CarFilters, SortOption } from '@/lib/types';

interface FilterBarProps {
  filters: CarFilters;
  onChange: (next: CarFilters) => void;
  onClear: () => void;
  resultCount: number;
  loading?: boolean;
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'luxury', label: 'Luxury' },
];

const FUEL_TYPES: { value: string; label: string }[] = [
  { value: '', label: 'All Fuels' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'cng', label: 'CNG' },
];

const TRANSMISSION_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Transmissions' },
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
];

const SEATING_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Any' },
  { value: '2', label: '2+' },
  { value: '4', label: '4+' },
  { value: '5', label: '5+' },
  { value: '7', label: '7+' },
  { value: '9', label: '9+' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A-Z' },
  { value: 'newest', label: 'Newest first' },
];

export default function FilterBar({
  filters,
  onChange,
  onClear,
  resultCount,
  loading = false,
}: FilterBarProps) {
  // Debounced search input (300 ms) — local state mirrors URL search.
  const [searchInput, setSearchInput] = useState(filters.search ?? '');

  useEffect(() => {
    setSearchInput(filters.search ?? '');
  }, [filters.search]);

  useEffect(() => {
    const t = setTimeout(() => {
      if ((filters.search ?? '') !== searchInput) {
        onChange({ ...filters, search: searchInput });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <section
      aria-label="Filters"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3">
        {/* Search row */}
        <div className="relative">
          <label htmlFor="search" className="sr-only">
            Search by car name or model
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by car name or model..."
            className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <FilterSelect
            id="category"
            label="Category"
            value={filters.category ?? ''}
            onChange={(v) => onChange({ ...filters, category: v as CarFilters['category'] })}
            options={CATEGORIES}
          />
          <FilterSelect
            id="fuel_type"
            label="Fuel"
            value={filters.fuel_type ?? ''}
            onChange={(v) => onChange({ ...filters, fuel_type: v as CarFilters['fuel_type'] })}
            options={FUEL_TYPES}
          />
          <FilterSelect
            id="transmission"
            label="Transmission"
            value={filters.transmission ?? ''}
            onChange={(v) => onChange({ ...filters, transmission: v as CarFilters['transmission'] })}
            options={TRANSMISSION_OPTIONS}
          />
          <div className="flex flex-col">
            <label htmlFor="min_price" className="mb-1 text-xs font-medium text-slate-600">
              Min Price (₹)
            </label>
            <input
              id="min_price"
              type="number"
              min={0}
              value={filters.min_price ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  min_price: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              placeholder="0"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="max_price" className="mb-1 text-xs font-medium text-slate-600">
              Max Price (₹)
            </label>
            <input
              id="max_price"
              type="number"
              min={0}
              value={filters.max_price ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  max_price: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              placeholder="Any"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <FilterSelect
            id="min_seating"
            label="Min Seats"
            value={filters.min_seating != null ? String(filters.min_seating) : ''}
            onChange={(v) =>
              onChange({
                ...filters,
                min_seating: v === '' ? undefined : Number(v),
              })
            }
            options={SEATING_OPTIONS}
          />
          <FilterSelect
            id="sort"
            label="Sort By"
            value={filters.sort ?? 'price_asc'}
            onChange={(v) => onChange({ ...filters, sort: v as SortOption })}
            options={SORT_OPTIONS}
          />
        </div>

        {/* Availability + result count + clear */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(filters.available_only)}
              onChange={(e) =>
                onChange({ ...filters, available_only: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Available only
          </label>

          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              {loading ? 'Loading…' : `${resultCount} car${resultCount === 1 ? '' : 's'} found`}
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                onClear();
              }}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function FilterSelect({ id, label, value, onChange, options }: FilterSelectProps) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1 text-xs font-medium text-slate-600">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
