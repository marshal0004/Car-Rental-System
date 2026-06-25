/**
 * Unit tests for car-rental frontend — filter URL <-> state sync utilities.
 *
 * Verifies that the new `transmission` filter survives a round-trip
 * through `filtersToQueryString` → `parseFiltersFromSearchParams`, and
 * that it appears in `getActiveFilterChips` so users can remove it.
 */
import { describe, it, expect } from 'vitest';
import {
  filtersToQueryString,
  parseFiltersFromSearchParams,
  getActiveFilterChips,
  emptyFilters,
  removeFilter,
} from '@/lib/filters';
import type { CarFilters } from '@/lib/types';

describe('filters — transmission round-trip', () => {
  it('serializes transmission to query string', () => {
    const f: CarFilters = { ...emptyFilters(), transmission: 'automatic' };
    expect(filtersToQueryString(f)).toContain('transmission=automatic');
  });

  it('omits transmission when empty', () => {
    const f: CarFilters = { ...emptyFilters(), transmission: '' };
    expect(filtersToQueryString(f)).not.toContain('transmission=');
  });

  it('parses transmission back from URLSearchParams', () => {
    const sp = new URLSearchParams('transmission=manual');
    const f = parseFiltersFromSearchParams(sp);
    expect(f.transmission).toBe('manual');
  });

  it('survives a full round-trip with multiple filters', () => {
    const original: CarFilters = {
      ...emptyFilters(),
      category: 'suv',
      transmission: 'automatic',
      sort: 'price_asc',
    };
    const qs = filtersToQueryString(original).replace(/^\?/, '');
    const parsed = parseFiltersFromSearchParams(new URLSearchParams(qs));
    // Only the *active* filters survive the round-trip — empty defaults are
    // intentionally dropped by the URL serializer to keep URLs clean.
    expect(parsed.category).toBe('suv');
    expect(parsed.transmission).toBe('automatic');
    expect(parsed.sort).toBe('price_asc');
    // Inactive fields come back as undefined (not the empty-string default).
    expect(parsed.fuel_type).toBeUndefined();
    expect(parsed.available_only).toBeUndefined();
  });
});

describe('getActiveFilterChips — transmission', () => {
  it('includes a transmission chip when set', () => {
    const f: CarFilters = { ...emptyFilters(), transmission: 'manual' };
    const chips = getActiveFilterChips(f);
    const t = chips.find((c) => c.key === 'transmission');
    expect(t).toBeDefined();
    expect(t?.value).toBe('manual');
  });

  it('omits transmission chip when empty', () => {
    const f: CarFilters = { ...emptyFilters(), transmission: '' };
    const chips = getActiveFilterChips(f);
    expect(chips.find((c) => c.key === 'transmission')).toBeUndefined();
  });
});

describe('removeFilter — transmission', () => {
  it('clears transmission when removeFilter(transmission) is called', () => {
    const f: CarFilters = { ...emptyFilters(), transmission: 'automatic' };
    const next = removeFilter(f, 'transmission');
    expect(next.transmission).toBeUndefined();
  });
});
