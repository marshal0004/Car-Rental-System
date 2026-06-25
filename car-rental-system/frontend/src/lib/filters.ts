// URL <-> filter state sync. Pure functions — no React, no Next imports.

import type { CarFilters, SortOption } from './types';

/**
 * Serialize a CarFilters object to a query string like `?category=suv&sort=price_asc`.
 * Empty / falsy values are omitted so URLs stay clean and shareable.
 */
export function filtersToQueryString(f: CarFilters): string {
  const params = new URLSearchParams();
  if (f.search && f.search.trim()) params.set('search', f.search.trim());
  if (f.category) params.set('category', f.category);
  if (f.fuel_type) params.set('fuel_type', f.fuel_type);
  if (f.transmission) params.set('transmission', f.transmission);
  if (f.min_price != null && !Number.isNaN(f.min_price)) params.set('min_price', String(f.min_price));
  if (f.max_price != null && !Number.isNaN(f.max_price)) params.set('max_price', String(f.max_price));
  if (f.min_seating != null && !Number.isNaN(f.min_seating)) params.set('min_seating', String(f.min_seating));
  if (f.available_only) params.set('available_only', 'true');
  if (f.sort) params.set('sort', f.sort);
  const s = params.toString();
  return s ? `?${s}` : '';
}

/**
 * Parse a `URLSearchParams` (e.g., from `useSearchParams()`) into a CarFilters object.
 * Invalid / empty values fall back to undefined.
 */
export function parseFiltersFromSearchParams(sp: URLSearchParams): CarFilters {
  const f: CarFilters = {};
  const search = sp.get('search');
  if (search) f.search = search;
  const category = sp.get('category');
  if (category) f.category = category as CarFilters['category'];
  const fuel = sp.get('fuel_type');
  if (fuel) f.fuel_type = fuel as CarFilters['fuel_type'];
  const transmission = sp.get('transmission');
  if (transmission) f.transmission = transmission as CarFilters['transmission'];
  const minP = sp.get('min_price');
  if (minP) {
    const n = Number(minP);
    if (!Number.isNaN(n)) f.min_price = n;
  }
  const maxP = sp.get('max_price');
  if (maxP) {
    const n = Number(maxP);
    if (!Number.isNaN(n)) f.max_price = n;
  }
  const minS = sp.get('min_seating');
  if (minS) {
    const n = Number(minS);
    if (!Number.isNaN(n)) f.min_seating = n;
  }
  if (sp.get('available_only') === 'true') f.available_only = true;
  const sort = sp.get('sort');
  if (sort) f.sort = sort as SortOption;
  return f;
}

/**
 * Build the query string used for the GET /api/cars backend call.
 * Same as filtersToQueryString but without the leading `?`.
 */
export function filtersToApiQuery(f: CarFilters): string {
  return filtersToQueryString(f).replace(/^\?/, '');
}

/**
 * Return an array of `{ key, label, value }` describing every active filter,
 * for rendering as removable chips below the FilterBar.
 */
export interface FilterChip {
  key: keyof CarFilters;
  label: string;
  value: string;
}

const SORT_LABELS: Record<SortOption, string> = {
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  name_asc: 'Name: A-Z',
  newest: 'Newest first',
};

export function getActiveFilterChips(f: CarFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  if (f.search) chips.push({ key: 'search', label: 'Search', value: f.search });
  if (f.category) chips.push({ key: 'category', label: 'Category', value: f.category });
  if (f.fuel_type) chips.push({ key: 'fuel_type', label: 'Fuel', value: f.fuel_type });
  if (f.transmission) chips.push({ key: 'transmission', label: 'Transmission', value: f.transmission });
  if (f.min_price != null) chips.push({ key: 'min_price', label: 'Min Price', value: `₹${f.min_price}` });
  if (f.max_price != null) chips.push({ key: 'max_price', label: 'Max Price', value: `₹${f.max_price}` });
  if (f.min_seating != null) chips.push({ key: 'min_seating', label: 'Min Seats', value: `${f.min_seating}+` });
  if (f.available_only) chips.push({ key: 'available_only', label: 'Available Only', value: 'Yes' });
  if (f.sort) chips.push({ key: 'sort', label: 'Sort', value: SORT_LABELS[f.sort] });
  return chips;
}

/**
 * Returns a new filter object with the given key removed (set to undefined).
 */
export function removeFilter(f: CarFilters, key: keyof CarFilters): CarFilters {
  const next: CarFilters = { ...f };
  if (key === 'available_only') {
    next.available_only = false;
  } else {
    (next as Record<string, unknown>)[key] = undefined;
  }
  return next;
}

/**
 * Empty filters object (used for "Clear all").
 */
export function emptyFilters(): CarFilters {
  return {
    search: undefined,
    category: '',
    fuel_type: '',
    transmission: '',
    min_price: undefined,
    max_price: undefined,
    min_seating: undefined,
    available_only: false,
    sort: undefined,
  };
}

/**
 * Count of active filters — used to show e.g. "Filters (3)".
 */
export function countActiveFilters(f: CarFilters): number {
  return getActiveFilterChips(f).length;
}
